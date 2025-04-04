import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';

export const Recommendations = () => {
    const [listingRecommendations, setListingRecommendations] = useState([]);
    const [error, setError] = useState(null);

    const { user, isAuthenticated, getAccessTokenSilently, isLoading: authLoading } = useAuth0();

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const token = await getAccessTokenSilently();
                
                if (!token) {
                    setError("Authorization token missing");
                    return;
                }

                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/recommendations`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { current_page: 'listings' },
                });

                console.log("API Response:", response.data);  // Log the full API response for debugging

                const { recommendations } = response.data;
                if (recommendations && recommendations.listing_recommendations) {
                    setListingRecommendations(recommendations.listing_recommendations);
                } else {
                    setError("No listing recommendations found");
                }

            } catch (error) {
                console.error("Error fetching recommendations:", error);
                setError("Failed to fetch recommendations");
            }
        };

        fetchRecommendations();
    }, []); // Empty array ensures this effect runs only once when the component is mounted

    // Log listingRecommendations to debug the data
    useEffect(() => {
        console.log("Listing Recommendations:", listingRecommendations);  // Print listingRecommendations here
    }, [listingRecommendations]); // This will log whenever listingRecommendations changes

    return (
        <div>
            <h2>Recommended Listings</h2>
            {error && <p>{error}</p>}
            <ul>
                {listingRecommendations.length > 0 ? (
                    listingRecommendations.map((item, index) => (
                        <li key={index}>
                            <strong>Listing ID:</strong> {item.listing_id} <br />
                            <strong>Score:</strong> {item.score}
                        </li>
                    ))
                ) : (
                    <p>No recommendations available.</p>
                )}
            </ul>
        </div>
    );
};
