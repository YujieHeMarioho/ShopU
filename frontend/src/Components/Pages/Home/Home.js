import React, { useState, useEffect, useCallback } from 'react';
import { Banner } from '../../Common';
import styles from './Home.module.css';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Recommendations } from '../../Common';

function Home() {    
    const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();
    const [stats, setStats] = useState({
        listings: 0,
        users: 0,
        productsSold: 0,
        feedPosts: 0,
    });

    const [categories, setCategories] = useState([]);
    const maxDisplayCategories = 10;

    const navigate = useNavigate();  // Initialize navigate

    // Handle the click event
    const handleCategoryClick = (category) => {
        navigate(`/marketplace?category=${encodeURIComponent(category)}`);
    };


    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [feedRes, listingsRes, usersRes, productsRes] = await Promise.all([
                    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feed/count`
                    ),
                    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/count`),
                    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/count`),
                    // fetch(`${process.env.REACT_APP_BACKEND_URL}/api/products/sold/count`)
                ]);
    
                if (!feedRes.ok || !listingsRes.ok || !usersRes.ok) {
                    throw new Error('One or more requests failed');
                }
    
                const feedData = await feedRes.json();
                const listingsData = await listingsRes.json();
                const usersData = await usersRes.json();
                //const productsData = await productsRes.json();
    
                setStats({
                    listings: listingsData.total_listings || 0,
                    users: usersData.total_users || 0,
                    productsSold: 0,
                    feedPosts: feedData.total_feed_posts || 0, 
                });
    
            } catch (error) {
                console.error('Error fetching statistics:', error);
            }
        };
    
        fetchStats();
        fetchCategories();
    }, []);
    
    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/filters`);
            const rawData = await response.json();
            setCategories(rawData.categories.slice(0, maxDisplayCategories) || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }, []);

    useEffect(() => {
        console.log('Authentication state:', isAuthenticated);
      }, [isAuthenticated]);

    return (
        <div className={styles['home-container']}>

            <Recommendations></Recommendations>
            {/* Banner Section */}
            <Banner
                title="Welcome to ShopU!"
                description="Discover the best deals on dorm essentials, textbooks, and services from your campus community."
                className={styles.banner}
            />

            {/* Feature Highlights Section */}
            <section className={styles['feature-highlights']}>
                <h2>Why Choose ShopU?</h2>
                <div className={styles.features}>
                    <div className={styles.feature}>
                        <h3>Affordable Essentials</h3>
                        <p>Find quality dorm furniture, textbooks, and more at student-friendly prices.</p>
                    </div>
                    <div className={styles.feature}>
                        <h3>Support Student Entrepreneurs</h3>
                        <p>Discover unique products and services offered by your peers.</p>
                    </div>
                    <div className={styles.feature}>
                        <h3>Connect with Your Community</h3>
                        <p>Engage with other students through interactive features and shared listings.</p>
                    </div>
                </div>
            </section>


            {/* Dynamic Statistics Section */}
            <section className={styles['statistics-section']}>
                <h2>ShopU by the Numbers</h2>
                <div className={styles.statistics}>
                    <div className={styles.stat}>
                        <h3>{stats.listings.toLocaleString()}</h3>
                        <p>Listings Available</p>
                    </div>
                    <div className={styles.stat}>
                        <h3>{stats.users.toLocaleString()}</h3>
                        <p>Active Users</p>
                    </div>
                    <div className={styles.stat}>
                        <h3>{stats.productsSold.toLocaleString()}</h3>
                        <p>Products Sold</p>
                    </div>
                    <div className={styles.stat}>
                        <h3>{stats.feedPosts.toLocaleString()}</h3>
                        <p>Feed Posts</p>
                    </div>
                </div>
            </section>


           {/* Interactive Hover Section */}
            <section className={styles['hover-section']}>
                <h2>Explore Our Categories</h2>
                <div className={styles['hover-categories']}>
                    {categories.length > 0 ? (
                        categories.map((category, index) => (
                            <div 
                                key={index} 
                                className={styles['category-card']} 
                                onClick={() => handleCategoryClick(category)}
                            >
                                <h3>{category}</h3>
                            </div>
                        ))
                    ) : (
                        <p>Loading categories...</p>
                    )}
                </div>
            </section>



            {/* Testimonials Section */}
            <section className={styles['testimonials']}>
                <h2>What Our Users Are Saying</h2>
                <div className={styles['testimonial-cards']}>
                    <div className={styles['testimonial-card']}>
                        <p>"ShopU made it so easy to find affordable textbooks. Highly recommend!"</p>
                        <h4>- Sarah, Student</h4>
                    </div>
                    <div className={styles['testimonial-card']}>
                        <p>"I sold my old dorm furniture on ShopU and made some extra cash. It’s a game-changer!"</p>
                        <h4>- Jake, Student Entrepreneur</h4>
                    </div>
                </div>
            </section>

            {/* Call-to-Action Section */}
            <section className={styles['call-to-action']}>
                <h2>Ready to Get Started?</h2>
                <p>Create your first listing or browse items from your campus today!</p>
                <button
                    className={styles['cta-button']}
                    onClick={loginWithRedirect}
                >
                    Join Now
                </button>
            </section>

        </div>
    );
}

export default Home;
