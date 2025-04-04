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
def get_listings_data():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(""" 
            SELECT l.listing_id, c.name AS category_name, l.description, l.title, l.item_type, l.date_posted, l.location
            FROM listings l
            JOIN categories c ON l.category_id = c.category_id
        """)
        listings = cursor.fetchall()
        conn.close()

        # Convert the query result into a pandas DataFrame
        listings_df = pd.DataFrame(list(listings), columns=["listing_id", "category_name", "description", "title", "item_type", "date_posted", "location"])
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
                f.listing_id
            FROM
                feed_posts f
            JOIN
                users u ON f.user_id = u.user_id
            WHERE
                f.user_id != %s
            ORDER BY
                f.date_created DESC;
        """, (user_id,))

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

        feed_df = pd.DataFrame(list(feed), columns=["post_id", "title", "content", "image", "date_created", "profile", "author", "author_id", "likes_count", "shares_count", "item_details", "listing_id"])
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
    # sorted_recommendations = handle_new_and_unseen_posts(sorted_recommendations, user_id, listings, feed_posts)
    
    # # Apply friend and category logic to adjust recommendations further
    # sorted_recommendations = adjust_for_friends_and_categories(sorted_recommendations, friend_ids, user_preferred_categories)
    
    # Return sorted listing IDs or post IDs with their final scores
    return sorted_recommendations


def map_tfidf_to_ids(tfidf_matrix, data_frame, id_column='listing_id'):
    """
    Maps the non-zero TF-IDF values to their corresponding item IDs (listing_id or feed_post_id).
    
    :param tfidf_matrix: Sparse matrix (csr_matrix) containing the TF-IDF values
    :param data_frame: pandas DataFrame containing item details, where each item has a unique identifier (`listing_id` or `feed_post_id`)
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



# def handle_new_and_unseen_posts(sorted_recommendations, user_id, listings, feed_posts):
#     """
#     Adjust recommendations to handle unseen posts and new listings by prioritizing them
#     if they are relevant (high TF-IDF scores) or if they are recent.
#     """
#     unseen_posts = []

#     # Assume that unseen posts are those with no user interaction
#     for post_id, score in sorted_recommendations:
#         if post_id not in listings.get('user_interactions', {}).get(user_id, []):  # Unseen posts
#             unseen_posts.append(post_id)

#     # Prioritize unseen posts by boosting their recommendation score
#     for post_id in unseen_posts:
#         # Boost score for unseen posts
#         sorted_recommendations.append((post_id, 10))  # Boost factor for unseen posts (adjust as needed)
    
#     return sorted_recommendations

# def adjust_for_friends_and_categories(sorted_recommendations, friend_ids, user_preferred_categories):
#     """
#     Adjust recommendations by considering interactions from friends and the user's preferred categories.
#     """
#     adjusted_recommendations = []

#     # Boost posts that friends have interacted with
#     for post_id, score in sorted_recommendations:
#         if any(friend_id in friend_ids for friend_id in friend_ids):
#             score += 2  # Boost factor for friends' interactions (adjust as needed)
        
#         # Boost posts in preferred categories
#         post_category = get_post_tags(post_id)  # Assume this function returns the category of the post
#         if post_category in user_preferred_categories:
#             score += 3  # Boost factor for category relevance (adjust as needed)
        
#         adjusted_recommendations.append((post_id, score))
    
#     # Sort recommendations again based on the updated score
#     adjusted_recommendations = sorted(adjusted_recommendations, key=lambda x: x[1], reverse=True)

#     return adjusted_recommendations

def get_post_tags(post_id):
    """
    Get the tags for a specific post based on its post_id.
    
    Args:
    - post_id (str): The ID of the post.
    
    Returns:
    - list: The tags associated with the post.
    """
    try:
        # Find the post row by post_id
        post = posts[posts['post_id'] == post_id]
        
        # Check if the post exists
        if post.empty:
            raise ValueError(f"Post with ID {post_id} not found.")
        
        # Return the tags for the post (assuming tags are stored in a list format in the 'tags' column)
        return post['tags'].values[0]  # Assuming 'tags' is a column with list of tags
    
    except Exception as e:
        # If there is an error (e.g., post_id not found), return an empty list
        print(f"Error getting tags for post {post_id}: {e}")
        return []



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
    listings = get_listings_data()
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
