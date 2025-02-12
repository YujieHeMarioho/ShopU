import React, { useState, useEffect } from 'react';
import { Banner, Statistics } from '../../Common';
import styles from './Home.module.css'; // Importing styles from Home.module.css
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

function Home() {    
    const {isAuthenticated, loginWithRedirect} = useAuth0();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        listings: 0,
        users: 0,
        productsSold: 0,
    });

    // Simulate fetching statistics (can be replaced with actual API call)
    useEffect(() => {
        const fetchStats = async () => {
            // Simulating API call for statistics
            setTimeout(() => {
                setStats({
                    listings: 5000,
                    users: 1200,
                    productsSold: 3000,
                });
            }, 1000);
        };
        fetchStats();
    }, []);

    useEffect(() => {
        console.log('Authentication state:', isAuthenticated);
      }, [isAuthenticated]);

    return (
        <div className={styles['home-container']}>

            {/* Enhanced Banner Section */}
            <Banner
                title="Welcome to ShopU!"
                description="Discover the best deals on dorm essentials, textbooks, and services from your campus community."
                className={styles.banner}
            />

            {/* New Feature Highlights Section */}
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
                        <h3>{stats.listings}</h3>
                        <p>Listings Available</p>
                    </div>
                    <div className={styles.stat}>
                        <h3>{stats.users}</h3>
                        <p>Active Users</p>
                    </div>
                    <div className={styles.stat}>
                        <h3>{stats.productsSold}</h3>
                        <p>Products Sold</p>
                    </div>
                </div>
            </section>

            {/* Interactive Hover Section */}
            <section className={styles['hover-section']}>
                <h2>Explore Our Categories</h2>
                <div className={styles['hover-categories']}>
                    <div className={styles['category-card']}>
                        <h3>Dorm Furniture</h3>
                    </div>
                    <div className={styles['category-card']}>
                        <h3>Textbooks</h3>
                    </div>
                    <div className={styles['category-card']}>
                        <h3>Student Services</h3>
                    </div>
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

                        {/* Interactive Call-to-Action Section */}
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
