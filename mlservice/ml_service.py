from fastapi import FastAPI, HTTPException
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

# Load environment variables from the .env file
load_dotenv()

app = FastAPI()

# Database connection setup using psycopg2
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT"),
    )
    return conn

# Function to fetch user data (user preferences, liked posts) from the database
def get_user_data(user_id: str):
    print(f"Fetching user data for user_id: {user_id}")

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Fetch user preferences (user_interests)
    cursor.execute(f"SELECT user_interests FROM user_settings WHERE user_id = %s", (user_id,))
    user_settings = cursor.fetchone()
    if not user_settings:
        print(f"Error: User settings not found for user_id: {user_id}")
        raise HTTPException(status_code=404, detail="User settings not found")

    print(f"User settings: {user_settings}")

    # Fetch user engagement (liked posts, etc.)
    cursor.execute(f"SELECT post_id FROM user_engagement WHERE user_id = %s", (user_id,))
    engagement = cursor.fetchall()
    liked_post_ids = [eng['post_id'] for eng in engagement]
    print(f"Liked post IDs: {liked_post_ids}")

    # Fetch social graph (friends)
    cursor.execute(f"SELECT friend_id FROM user_social_graph WHERE user_id = %s", (user_id,))
    friends = cursor.fetchall()
    friend_ids = [friend['friend_id'] for friend in friends]
    print(f"Friend IDs: {friend_ids}")

    conn.close()

    # Return the user settings (user_interests), liked posts, and friends
    return user_settings['user_interests'], liked_post_ids, friend_ids



# Function to fetch listings data from the database
def get_listings_data():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Fetch listings data without likes column, assuming `likes` is not needed for listings
    cursor.execute("""
        SELECT l.listing_id, c.name AS category_name, l.description
        FROM listings l
        JOIN categories c ON l.category_id = c.category_id
    """)
    listings = cursor.fetchall()
    conn.close()
    
    # Convert the query result into a pandas DataFrame
    listings_df = pd.DataFrame(list(listings), columns=["listing_id", "category_name", "description"])
    return listings_df

def get_feed_data(user_id: str):
    print(f"Fetching feed data for user_id: {user_id}")
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Fetch the feed posts without the isLiked column
    cursor.execute("""
        SELECT
            f.post_id,
            f.title,
            f.content,
            u.profile_image AS profile,
            fi.file_key AS image,
            f.date_created,
            u.name AS author,
            u.user_id AS author_id,
            f.likes_count,
            f.listing_id,
            COALESCE(ARRAY_AGG(t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), ARRAY[]::TEXT[]) AS tags
        FROM
            feed_posts f
        JOIN
            users u ON f.user_id = u.user_id
        JOIN
            post_images fi ON f.post_id = fi.post_id
        LEFT JOIN
            post_tags pt ON f.post_id = pt.post_id
        LEFT JOIN
            tags t ON pt.tag_id = t.tag_id
        WHERE
            f.user_id != %s
        GROUP BY
            f.post_id, u.user_id, fi.file_key
        ORDER BY
            f.date_created DESC;
    """, (user_id,))
    
    feed = cursor.fetchall()

    # If no feed posts are found, return empty result
    if not feed:
        print("No feed posts found for the user.")
        return []

    # Fetch whether each post is liked by the user using a separate query
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
    
    # Debug: Check the fetched liked_status data
    print(f"Fetched liked_status: {liked_status}")

    # Convert feed to DataFrame for easier processing
    feed_df = pd.DataFrame(list(feed), columns=["post_id", "title", "content", "profile", "image", "date_created", "author", "author_id", "likes_count", "listing_id", "tags"])

    # Convert liked_status to DataFrame
    liked_status_df = pd.DataFrame(list(liked_status), columns=["post_id", "isLiked"])

    # Debug: Check the merged data before merging
    print(f"Feed Data (before merge): {feed_df.head()}")
    print(f"Liked Status Data: {liked_status_df.head()}")

    # Merge feed data with the liked status
    feed_df = feed_df.merge(liked_status_df, on="post_id", how="left")

    # Clean the data: replace NaN in likes_count with 0
    feed_df['listing_id'] = feed_df['listing_id'].fillna("No ID")

    # Debug: Check the merged feed data after cleaning
    print(f"Final Merged Feed Data (after cleaning): {feed_df.head()}")

    # Process image URLs if needed
    # If you're working with URLs for images or other transformations, you can handle them here.
    
    return feed_df



from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
from fastapi import HTTPException

def get_recommendations(user_id: str):
    print(f"Fetching recommendations for user_id: {user_id}")

    # Fetch user data (user preferences, liked posts, friends)
    try:
        user_preferred_categories, liked_post_ids, friend_ids = get_user_data(user_id)
        print(f"User preferences: {user_preferred_categories}, Liked posts: {liked_post_ids}, Friend IDs: {friend_ids}")
    except HTTPException as e:
        print(f"Error fetching user data: {e}")
        raise e  # Re-raise the error if fetching user data fails

    # Fetch listings data (for recommendations)
    try:
        listings = get_listings_data()
        print(f"Fetched listings data: {listings.head()}")
    except Exception as e:
        print(f"Error fetching listings data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching listings data")
    
    # Fetch feed data (feed recommendations)
    try:
        feed = get_feed_data(user_id)  # Fetch feed posts
        print(f"Fetched feed data: {feed.head()}")
    except Exception as e:
        print(f"Error fetching feed data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching feed data")

    # --- Recommendations for Listings ---
    preferred_listings = listings[listings['category_name'].isin(user_preferred_categories)]
    
    # Ensure non-empty descriptions before applying TF-IDF
    preferred_listings = preferred_listings[preferred_listings['description'].str.strip() != '']
    
    if preferred_listings.empty:
        print("No valid listings available for recommendations.")
        return {"listings": [], "feed": []}

    # Content-based filtering using TF-IDF
    vectorizer = TfidfVectorizer(stop_words='english')
    description_matrix = vectorizer.fit_transform(preferred_listings['description'])
    
    # If after filtering we still have no content for TF-IDF, handle the case
    if description_matrix.shape[0] == 0:
        raise HTTPException(status_code=500, detail="Empty vocabulary for TF-IDF. Please ensure that descriptions are non-empty.")
    
    similarity_matrix = cosine_similarity(description_matrix)
    recommended_items = similarity_matrix.argsort(axis=1)[:, -3:]  # Top 3 similar items
    
    recommended_listings = preferred_listings.iloc[recommended_items.flatten()]
    
    # Boost recommendations for listings based on user activity (liked posts)
    boosted_recommendations = recommended_listings.copy()
    if liked_post_ids:
        boosted_recommendations['boost'] = boosted_recommendations['listing_id'].apply(
            lambda x: 2 if x in liked_post_ids else 1
        )
    
    print(f"Boosted listings recommendations: {boosted_recommendations.head()}")
    
    # --- Recommendations for Feed Posts ---
    recommended_feed = feed.copy()
    
    # Example: Boost feed recommendations for posts liked by friends
    if friend_ids:
        friend_recommended_posts = feed[feed['user_id'].isin(friend_ids)]
        recommended_feed = pd.concat([recommended_feed, friend_recommended_posts])

    # Combine both listings and feed recommendations
    all_recommendations = {
        "listings": boosted_recommendations.drop_duplicates().to_dict(orient='records'),
        "feed": recommended_feed.drop_duplicates().to_dict(orient='records')
    }
    
    return all_recommendations






@app.get("/recommend")
async def recommend(user_id: str):  # Accept user_id as a query parameter
    print(f"Request received for recommendations for user_id: {user_id}")
    
    # Get recommendations for the user
    recommendations = get_recommendations(user_id)
    
    return {"user_id": user_id, "recommendations": recommendations}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
