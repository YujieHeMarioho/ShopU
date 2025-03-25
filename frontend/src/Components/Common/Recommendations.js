import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from '@auth0/auth0-react';

export const Recommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
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

                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/recommendations`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setRecommendations(response.data.recommendations);
            } catch (error) {
                console.error("Error fetching recommendations:", error);
                setError("Failed to fetch recommendations");
            }
        };

        fetchRecommendations();
    }, []);

    return (
        <div>
            <h2>Recommended Listings</h2>
            {error && <p>{error}</p>}
            <ul>
                {recommendations.map((item, index) => (
                    <li key={index}>
                        <strong>{item.category}:</strong> {item.description}
                    </li>
                ))}
            </ul>
        </div>
    );
};
