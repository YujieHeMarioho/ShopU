from fastapi import FastAPI, HTTPException
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
import json
import numpy as np
import uvicorn
from scipy.sparse import hstack

# Load environment variables from the .env file
load_dotenv()

app = FastAPI()

# Database connection setup using psycopg2
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT"),
        )
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")

# Function to fetch user data (user preferences, liked posts) from the database
def get_user_data(user_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Fetch user preferences (user_interests)
        cursor.execute(f"SELECT user_interests FROM user_settings WHERE user_id = %s", (user_id,))
        user_settings = cursor.fetchone()
        if not user_settings:
            print(f"Error: User settings not found for user_id: {user_id}")
            raise HTTPException(status_code=404, detail="User settings not found")

        # Fetch social graph (friends)
        cursor.execute(f"SELECT friend_id FROM friends WHERE user_id = %s", (user_id,))
        friends = cursor.fetchall()
        friend_ids = [friend['friend_id'] for friend in friends]
        conn.close()

        # Return the user settings (user_interests), liked posts, and friends
        return user_settings['user_interests'], friend_ids

    except Exception as e:
        print(f"Error fetching user data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching user data")

# Function to fetch listings data from the database
def get_listings_data(user_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(""" 
            SELECT
                l.listing_id,
                c.name AS category_name,
                l.description,
                l.title,
                l.item_type,
                l.date_posted,
                l.location,
                l.user_id AS author_id,  -- Added author_id to the query
                (CASE WHEN ulv.listing_id IS NOT NULL THEN TRUE ELSE FALSE END) AS viewed
            FROM
                listings l
            JOIN
                categories c ON l.category_id = c.category_id
            LEFT JOIN
                user_listing_viewed ulv ON ulv.listing_id = l.listing_id AND ulv.user_id = %s
        """, (user_id,))

        listings = cursor.fetchall()
        conn.close()

        listings_df = pd.DataFrame(list(listings), columns=["listing_id", "category_name", "description", "title", "item_type", "date_posted", "location", "author_id", "viewed"])
        return listings_df

    except Exception as e:
        print(f"Error fetching listings data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching listings data")



# Function to fetch feed data from the database
def get_feed_data(user_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(""" 
            SELECT
                f.post_id,
                f.title,
                f.content,
                f.image_url AS image,
                f.date_created,
                u.profile_image AS profile,
                u.name AS author,
                u.user_id AS author_id,
                f.likes_count,
                f.shares_count,
                f.item_details,
                f.listing_id,
                COALESCE(ARRAY_AGG(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), ARRAY[]::TEXT[]) AS tags,
                CASE 
                    WHEN upv.post_id IS NOT NULL THEN TRUE 
                    ELSE FALSE 
                END AS viewed
            FROM feed_posts f
            JOIN users u ON f.user_id = u.user_id
            LEFT JOIN user_post_viewed upv 
                ON f.post_id = upv.post_id AND upv.user_id = %s
            LEFT JOIN post_tags pt ON f.post_id = pt.post_id -- Join with post_tags
            LEFT JOIN tags t ON pt.tag_id = t.tag_id -- Join with tags
            WHERE f.user_id != %s
            GROUP BY f.post_id, u.user_id, f.image_url, f.title, f.content, f.date_created, u.profile_image, u.name, f.likes_count, f.shares_count, f.item_details, f.listing_id, upv.post_id
            ORDER BY f.date_created DESC;

        """, (user_id, user_id))

        feed = cursor.fetchall()
        if not feed:
            print("No feed posts found for the user.")
            return []

        post_ids = [post['post_id'] for post in feed]
        cursor.execute(""" 
            SELECT
                post_id,
                EXISTS (
                    SELECT 1
                    FROM post_likes pl
                    WHERE pl.post_id = f.post_id AND pl.user_id = %s
                ) AS isLiked
            FROM feed_posts f
            WHERE f.post_id IN %s;
        """, (user_id, tuple(post_ids)))

        liked_status = cursor.fetchall()

        feed_df = pd.DataFrame(list(feed), columns=["post_id", "title", "content", "image", "date_created", "profile", "author", "author_id", "likes_count", "shares_count", "item_details", "listing_id", "tags", "viewed"])
        liked_status_df = pd.DataFrame([{'post_id': row['post_id'], 'isLiked': row['isliked']} for row in liked_status])

        feed_df = feed_df.merge(liked_status_df, on="post_id", how="left")
        feed_df['listing_id'] = feed_df['listing_id'].fillna("No ID")
        return feed_df

    except Exception as e:
        print(f"Error fetching feed data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching feed data")


    

# Recommendation calculation logic for listings and feed data
def calculate_recommendations(user_id, listings, feed_posts, user_preferred_categories, friend_ids, current_page='listings'):
    # Create user-item and user-feed matrices
    user_item_matrix = create_user_item_matrix(user_id, listings)
    user_feed_matrix = create_user_feed_matrix(user_id, feed_posts)

    # Apply TF-IDF on listings and feeds
    tfidf_listings, tfidf_feed = apply_tfidf_transform(listings, feed_posts)

    # Prepare data structures to hold final recommendations
    final_scores_listings = []
    final_scores_feed = []

    # Map the TF-IDF scores for listings and feed posts
    mapped_tfidf = map_tfidf_to_ids(tfidf_listings, listings)
    simplified_listing_tfidf = [(listing_id, tfidf_value) for listing_id, _, tfidf_value in mapped_tfidf]
    mapped_tfidf = map_tfidf_to_ids(tfidf_feed, feed_posts, id_column='post_id')
    simplified_post_tfidf = [(post_id, tfidf_value) for post_id, _, tfidf_value in mapped_tfidf]

    # Iterate through each listing_id in listings or feed posts
    if current_page == 'listings':
        # Iterate through all listing IDs (listings)
        for listing_id in listings['listing_id']:
            # Fetch the interaction values for this user and listing_id
            user_interaction = user_item_matrix.loc[user_id, listing_id] if listing_id in user_item_matrix.columns else 0
            
            # Get the corresponding TF-IDF score for the listing_id
            tfidf_score = next((score for _id, score in simplified_listing_tfidf if _id == listing_id), 0)
            
            # Final score: Combine user interaction score with TF-IDF score (you could weight them as needed)
            final_score = user_interaction * tfidf_score
            final_scores_listings.append((listing_id, final_score))
        
        # Sort final scores for listings based on the combined score (descending order)
        sorted_recommendations = sorted(final_scores_listings, key=lambda x: x[1], reverse=True)
    
    elif current_page == 'feed':
        # Iterate through all feed post IDs
        for post_id in feed_posts['post_id']:
            # Fetch the interaction values for this user and post_id
            user_interaction = user_feed_matrix.loc[user_id, post_id] if post_id in user_feed_matrix.columns else 0
            
            # Get the corresponding TF-IDF score for the post_id
            tfidf_score = next((score for _id, score in simplified_post_tfidf if _id == post_id), 0)
            
            # Final score: Combine user interaction score with TF-IDF score (you could weight them as needed)
            final_score = user_interaction * tfidf_score
            final_scores_feed.append((post_id, final_score))
        
        # Sort final scores for feed based on the combined score (descending order)
        sorted_recommendations = sorted(final_scores_feed, key=lambda x: x[1], reverse=True)
    
    else:
        raise ValueError("current_page must be 'listings' or 'feed'")

    # # Handle unseen posts and new listings (adjust scores)
    sorted_recommendations = handle_new_and_unseen_posts(sorted_recommendations, user_id, listings, feed_posts, current_page)
    
    # # Apply friend and category logic to adjust recommendations further
    sorted_recommendations = adjust_for_friends_and_categories(sorted_recommendations, friend_ids, user_preferred_categories, listings, feed_posts, current_page)
    
    # Return sorted listing IDs or post IDs with their final scores
    return sorted_recommendations


def map_tfidf_to_ids(tfidf_matrix, data_frame, id_column='listing_id'):
    """
    Maps the non-zero TF-IDF values to their corresponding item IDs (listing_id or feed_post_id).
    
    :param tfidf_matrix: Sparse matrix (csr_matrix) containing the TF-IDF values
    :param data_frame: pandas DataFrame containing item details, where each item has a unique identifier (`listing_id` or `post_id`)
    :param id_column: Name of the column containing the unique ID for each item (default is 'listing_id', can be changed for feed_posts)
    :return: List of tuples (item_id, term_index, tfidf_value) representing the TF-IDF values
    """
    # Get the non-zero indices and values from the sparse matrix
    rows, cols = tfidf_matrix.nonzero()  # Rows and columns of non-zero elements
    values = tfidf_matrix.data  # Non-zero TF-IDF values

    # Create the mapping for item IDs with their respective term and TF-IDF values
    mapped_tfidf = []

    for row, col, value in zip(rows, cols, values):
        # Access the item ID using .iloc to fetch the correct row and the specified column
        item_id = data_frame.iloc[row][id_column]  # Access the item ID based on the provided column name
        mapped_tfidf.append((item_id, col, value))  # (item_id, term_index, tfidf_value)

    return mapped_tfidf



def handle_new_and_unseen_posts(sorted_recommendations, user_id, listings_df, feed_df, currPage):
    """
    Adjust recommendations by separately boosting scores for unseen listings and feed posts.
    Boost is applied if content is relevant and unseen.
    """

    if currPage == "listings":
        unseen_ids = set(listings_df[~listings_df['viewed']]["listing_id"])
    else: 
        unseen_ids = set(feed_df[~feed_df['viewed']]["post_id"])

    boosted_recommendations = []

    for id, score in sorted_recommendations:
        if id in unseen_ids:
            boosted_recommendations.append((id, score + 0.5))
        else:
            boosted_recommendations.append((id, score))

    boosted_recommendations.sort(key=lambda x: x[1], reverse=True)

    return boosted_recommendations

from difflib import SequenceMatcher

def fuzzy_match(str1, str2, threshold=0.7):
    return SequenceMatcher(None, str1.lower(), str2.lower()).ratio() >= threshold

def adjust_for_friends_and_categories(sorted_recommendations, friend_ids, user_preferred_categories, listings_df, feed_df, currPage):
    """
    Adjust recommendations by boosting scores based on:
    - Whether the author is a friend
    - Whether the listing/post matches preferred categories or tags (fuzzy match)
    
    Parameters:
    - sorted_recommendations: list of (id, score) tuples
    - friend_ids: list of friend user IDs
    - user_preferred_categories: list of strings
    - listings_df / feed_df: full DataFrame for context
    - currPage: 'listings' or 'feed'
    """
    adjusted_recommendations = []

    if currPage == 'listings':
        df = listings_df
        id_col = 'listing_id'
        category_col = 'category_name'
        author_col = 'author_id'
    else:
        df = feed_df
        id_col = 'post_id'
        category_col = 'tags' 
        author_col = 'author_id'

    df = df.set_index(id_col)

    for item_id, score in sorted_recommendations:
        if item_id not in df.index:
            adjusted_recommendations.append((item_id, score))
            continue

        row = df.loc[item_id]

        # Boost if author is a friend
        if row[author_col] in friend_ids:
            score += 0.3

        # Boost for matching category or tags
        if currPage == 'listings':
            category = row[category_col]
            if any(fuzzy_match(category, pref) for pref in user_preferred_categories):
                score += 0.6
        else:
            tags = row[category_col]
            if isinstance(tags, str):
                tags = [tag.strip() for tag in tags.split(',')]
            if any(fuzzy_match(tag, pref) for tag in tags for pref in user_preferred_categories):
                score += 0.6

        adjusted_recommendations.append((item_id, score))

    adjusted_recommendations.sort(key=lambda x: x[1], reverse=True)
    return adjusted_recommendations


# Create a user-item interaction matrix (e.g., likes, views, etc.)
def create_user_item_matrix(user_id, listings):
    # Fetch interactions from database
    favorites = get_listing_favorites(listings['listing_id'])
    views = get_user_views(user_id, listings['listing_id'])
    
    # Calculate interaction value
    interaction_values = [(0.65 * favorite + 0.35 * view) for favorite, view in zip(favorites, views)]
    
    interactions = pd.DataFrame({
        'user_id': [user_id] * len(listings),
        'listing_id': listings['listing_id'],
        'interaction_value': interaction_values
    })
    
    user_item_matrix = interactions.pivot(index='user_id', columns='listing_id', values='interaction_value')
    return user_item_matrix

def get_listing_favorites(listing_ids):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT listing_id, COUNT(*) FROM favorites WHERE listing_id IN %s GROUP BY listing_id", (tuple(listing_ids),))
    favorite_counts = cursor.fetchall()
    conn.close()
    
    # Create a dictionary mapping listing_id to the number of favorites
    favorites_dict = {listing_id: count for listing_id, count in favorite_counts}
    
    # Return the number of favorites for each listing
    return [favorites_dict.get(listing_id, 0) for listing_id in listing_ids]

def get_user_views(user_id, listing_ids):
    """
    Fetches the number of views a user has made for a specific set of listings.
    :param user_id: ID of the user
    :param listing_ids: List of listing_ids to check the views for
    :return: A list of view counts corresponding to the listings
    """
    conn = get_db_connection()  # Assuming you have a function to get the database connection
    cursor = conn.cursor()
    
    # Query to get the count of views for each listing by the user
    cursor.execute("""
        SELECT listing_id, COUNT(*) AS view_count
        FROM user_listing_viewed
        WHERE user_id = %s AND listing_id IN %s
        GROUP BY listing_id
    """, (user_id, tuple(listing_ids)))
    
    # Fetch the results
    view_counts = cursor.fetchall()
    conn.close()
    
    # Create a dictionary mapping listing_id to the number of views
    view_counts_dict = {listing_id: count for listing_id, count in view_counts}
    
    # Return the number of views for each listing, defaulting to 0 if not found
    return [view_counts_dict.get(listing_id, 0) for listing_id in listing_ids]


# Create a user-feed interaction matrix
def create_user_feed_matrix(user_id, feed_posts):
    likes = feed_posts["likes_count"]
    shares = feed_posts["shares_count"]
    comments = get_feed_comments(feed_posts['post_id'])
    views = get_feed_views(user_id, feed_posts['post_id'])

    interaction_values = [
        (0.25 * like + 0.25 * comment + 0.25 * share + 0.25 * view)
        for like, comment, share, view in zip(likes, comments, shares, views)
    ]
    
    interactions = pd.DataFrame({
        'user_id': [user_id] * len(feed_posts),
        'post_id': feed_posts['post_id'],
        'interaction_value': interaction_values
    })

    user_feed_matrix = interactions.pivot(index='user_id', columns='post_id', values='interaction_value')
    return user_feed_matrix

# Function to get the number of comments for each post
def get_feed_comments(post_ids):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT post_id, COUNT(*) FROM post_comments WHERE post_id IN %s GROUP BY post_id", (tuple(post_ids),))
    comment_counts = cursor.fetchall()
    conn.close()
    
    # Map post_id to the number of comments
    comments_dict = {post_id: count for post_id, count in comment_counts}
    
    # Return comment counts for each post
    return [comments_dict.get(post_id, 0) for post_id in post_ids]

# Function to get the number of views for a user on specific posts
def get_feed_views(user_id, post_ids):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT post_id, COUNT(*) AS view_count
        FROM user_post_viewed
        WHERE user_id = %s AND post_id IN %s
        GROUP BY post_id
    """, (user_id, tuple(post_ids)))
    
    view_counts = cursor.fetchall()
    conn.close()
    
    # Map post_id to the number of views
    view_counts_dict = {post_id: count for post_id, count in view_counts}
    
    # Return view counts for each post, defaulting to 0 if not found
    return [view_counts_dict.get(post_id, 0) for post_id in post_ids]

# Apply TF-IDF transformation to the listings and feed content
def apply_tfidf_transform(listings, feed_posts):
    tfidf_vectorizer = TfidfVectorizer(stop_words='english', max_features=100)

    # Apply TF-IDF to the listings' description
    tfidf_listings = tfidf_vectorizer.fit_transform(listings['description'])

    # Apply TF-IDF to the feed posts' content
    tfidf_feed = tfidf_vectorizer.fit_transform(feed_posts['content'])
    return tfidf_listings, tfidf_feed

# Combine all matrices (user-item, user-feed, and TF-IDF) into one
def combine_matrices(user_item_matrix, user_feed_matrix, tfidf_listings, tfidf_feed):
    # Ensure all matrices are sparse (if not, convert them)
    user_item_matrix = user_item_matrix.fillna(0)
    user_feed_matrix = user_feed_matrix.fillna(0)

    # Combine the listings matrices (user-item + tfidf_listings)
    combined_listing_matrix = hstack([user_item_matrix, tfidf_listings])
    
    # Combine the feed matrices (user-feed + tfidf_feed)
    combined_feed_matrix = hstack([user_feed_matrix, tfidf_feed])
    
    return combined_listing_matrix, combined_feed_matrix

@app.get("/recommend")
async def recommend(user_id: str, current_page: str):
    # Fetch data
    listings = get_listings_data(user_id)
    feed_posts = get_feed_data(user_id)
    user_preferred_categories, friend_ids = get_user_data(user_id)
    
    # Fetch recommendations for listings page
    listing_recommendations = calculate_recommendations(user_id, listings, feed_posts, user_preferred_categories, friend_ids, 'listings')

    # Convert listing recommendations to a dictionary if it's a list of tuples
    listing_recommendations_dict = [{"listing_id": listing_id, "score": score} for listing_id, score in listing_recommendations]

    # Fetch recommendations for feed page
    feed_recommendations = calculate_recommendations(user_id, listings, feed_posts, user_preferred_categories, friend_ids, 'feed')

    # Convert feed recommendations to a dictionary if it's a list of tuples
    feed_recommendations_dict = [{"post_id": post_id, "score": score} for post_id, score in feed_recommendations]

    # Return the recommendations as a dictionary
    return {
        "user_id": user_id,
        "listing_recommendations": listing_recommendations_dict,
        "feed_recommendations": feed_recommendations_dict
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
