import React from 'react';
import { Banner, Statistics } from '../../Common';
import styles from './Home.module.css'; // Importing styles from Home.module.css

function Home() {
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

            {/* Call-to-Action Section */}
            <section className={styles['call-to-action']}>
                <h2>Ready to Get Started?</h2>
                <p>Create your first listing or browse items from your campus today!</p>
                <button className={styles['cta-button']} onClick={() => alert('Coming Soon!')}>Join Now</button>
            </section>

        </div>
    );
}

export default Home;
