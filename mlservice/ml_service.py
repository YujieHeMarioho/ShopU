from fastapi import FastAPI, HTTPException
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import json
import numpy as np
import uvicorn
from scipy.sparse import hstack

# Load environment variables from the .env file
load_dotenv()

app = FastAPI()

# Database connection setup using psycopg2
def get_db_connection():
    print("Establishing database connection...")
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT"),
        )
        print("Database connection established successfully.")
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")

# Function to fetch user data (user preferences, liked posts) from the database
def get_user_data(user_id: str):
    print(f"Fetching user data for user_id: {user_id}")
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Fetch user preferences (user_interests)
        cursor.execute(f"SELECT user_interests FROM user_settings WHERE user_id = %s", (user_id,))
        user_settings = cursor.fetchone()
        if not user_settings:
            print(f"Error: User settings not found for user_id: {user_id}")
            raise HTTPException(status_code=404, detail="User settings not found")

        print(f"User settings: {user_settings}")

        # Fetch social graph (friends)
        cursor.execute(f"SELECT friend_id FROM friends WHERE user_id = %s", (user_id,))
        friends = cursor.fetchall()
        friend_ids = [friend['friend_id'] for friend in friends]
        print(f"Friend IDs: {friend_ids}")

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
        print(f"Fetched listings data: {listings_df.head()}")
        return listings_df

    except Exception as e:
        print(f"Error fetching listings data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching listings data")

def get_feed_data(user_id: str):
    print(f"Fetching feed data for user_id: {user_id}")
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
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
        
        print(f"Fetched liked status data: {liked_status}")

        feed_df = pd.DataFrame(list(feed), columns=["post_id", "title", "content", "profile", "image", "date_created", "author", "author_id", "likes_count", "listing_id", "tags"])
        liked_status_df = pd.DataFrame([{'post_id': row['post_id'], 'isLiked': row['isliked']} for row in liked_status])

        feed_df = feed_df.merge(liked_status_df, on="post_id", how="left")
        feed_df['listing_id'] = feed_df['listing_id'].fillna("No ID")

        print(f"Final Merged Feed Data (after cleaning): {feed_df.head()}")
        return feed_df

    except Exception as e:
        print(f"Error fetching feed data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching feed data")


def get_recommendations(user_id: str):
    print(f"Fetching recommendations for user_id: {user_id}")

    try:
        user_preferred_categories, friend_ids = get_user_data(user_id)
    except HTTPException as e:
        print(f"Error in fetching user data: {e}")
        raise e

    try:
        listings = get_listings_data()
    except Exception as e:
        print(f"Error in fetching listings data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching listings data")
    
    try:
        feed = get_feed_data(user_id)
    except Exception as e:
        print(f"Error in fetching feed data: {e}")
        raise HTTPException(status_code=500, detail="Error fetching feed data")

    # --- Listings Recommendations ---
    if user_preferred_categories:
        preferred_listings = listings[listings['category_name'].isin(user_preferred_categories)].copy()
    else:
        preferred_listings = listings.copy()


    # Fill NaN values with meaningful placeholders
    preferred_listings['description'] = preferred_listings['description'].fillna("No Description")
    preferred_listings['title'] = preferred_listings['title'].fillna("No Title")
    preferred_listings['category_name'] = preferred_listings['category_name'].fillna("Unknown Category")

    # Use separate TfidfVectorizers for each column
    tfidf_vectorizer_title = TfidfVectorizer(stop_words="english")
    tfidf_vectorizer_desc = TfidfVectorizer(stop_words="english")
    tfidf_vectorizer_category = TfidfVectorizer(stop_words="english")

    tfidf_title = tfidf_vectorizer_title.fit_transform(preferred_listings['title'])
    tfidf_desc = tfidf_vectorizer_desc.fit_transform(preferred_listings['description'])
    tfidf_category = tfidf_vectorizer_category.fit_transform(preferred_listings["category_name"])

    # Combine TF-IDF matrices (concatenation)
    tfidf_combined = hstack([tfidf_title, tfidf_desc, tfidf_category]) 

    print(tfidf_combined.shape)

    # Convert sparse matrix to dense format for sampling (only for visualization)
    tfidf_sample = pd.DataFrame(
        tfidf_combined.todense(),
        columns=(
            list(tfidf_vectorizer_title.get_feature_names_out()) +
            list(tfidf_vectorizer_desc.get_feature_names_out()) +
            list(tfidf_vectorizer_category.get_feature_names_out())
        ),
        index=preferred_listings["listing_id"]
    )
    print(tfidf_sample.sample(5, axis=1).sample(10, axis=0))

    # Compute cosine similarity
    cosine_sim = cosine_similarity(tfidf_combined)
    cosine_sim_df = pd.DataFrame(cosine_sim, index=preferred_listings["listing_id"], columns=preferred_listings["listing_id"])

    print('Shape:', cosine_sim_df.shape)
    print(cosine_sim_df.sample(5, axis=1).round(2))


    # Now handle confidence_score
    preferred_listings['confidence_score'] = preferred_listings['category_name'].apply(
        lambda x: 0.9 if x in user_preferred_categories else 0.5
    )

    # Sort by confidence score
    preferred_listings = preferred_listings.sort_values(by='confidence_score', ascending=False)


    # --- Feed Post Recommendations ---
    feed_copy = feed.copy()

    feed_copy['content'] = feed_copy['content'].fillna('')

    feed_tfidf_matrix = tfidf_vectorizer.fit_transform(feed_copy['content'])

    if feed["isLiked"]:
        liked_feed_content = feed_copy[feed_copy['isLiked']]['content']
        liked_feed_tfidf_matrix = tfidf_vectorizer.transform(liked_feed_content)
        
        cosine_sim_feed = cosine_similarity(liked_feed_tfidf_matrix, feed_tfidf_matrix)

        feed_copy['confidence_score'] = cosine_sim_feed.mean(axis=0)
    else:
        feed_copy['confidence_score'] = 0.5

    feed_copy = feed_copy.sort_values(by='confidence_score', ascending=False)

    print("Final Recommended Listings:\n", preferred_listings[['title', 'category_name', 'confidence_score']])
    print("Final Recommended Feed:\n", feed_copy[['title', 'confidence_score']])
    
    
    ## CREATE WAY TO CHECK LISTING VS FEED. Have the score from each be affected by a percentage based on which is active

    return {
        "listings": preferred_listings.to_dict(orient='records'),
        "feed": feed_copy.to_dict(orient='records')
    }


@app.get("/recommend")
async def recommend(user_id: str):
    print(f"Request received for recommendations for user_id: {user_id}")
    
    recommendations = get_recommendations(user_id)
    
    return {"user_id": user_id, "recommendations": recommendations}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
