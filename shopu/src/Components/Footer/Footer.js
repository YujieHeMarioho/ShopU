// src/components/Footer/Footer.js
import React from 'react';
import styles from './Footer.module.css';

const Footer = () => (
    <footer className={styles.footer}>
        <div className={styles.footerContent}>
            {/* Leftmost: Logo and description */}
            <div className={styles.section}>
                <h2 className={styles.logo}>ShopU</h2>
                <p>Your one-stop shop for college essentials and more.</p>
            </div>
            
            {/* Middle left: Categories */}
            <div className={styles.section}>
                <h3>Categories</h3>
                <ul className={styles.linkList}>
                    <li><a href="#furniture">Furniture</a></li>
                    <li><a href="#electronics">Electronics</a></li>
                    <li><a href="#clothing">Clothing & Accessories</a></li>
                    <li><a href="#hobbies">Hobbies</a></li>
                    <li><a href="#family">Family</a></li>
                    <li><a href="#free-stuff">Free Stuff</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#events">Events</a></li>
                </ul>
            </div>

            {/* Middle right: Support links */}
            <div className={styles.section}>
                <h3>Support</h3>
                <ul className={styles.linkList}>
                    <li><a href="#help">Help & Support</a></li>
                    <li><a href="#terms">Terms & Conditions</a></li>
                    <li><a href="#privacy">Privacy Policy</a></li>
                    <li><a href="#help">Help</a></li>
                </ul>
            </div>

            {/* Rightmost: Newsletter */}
            <div className={styles.section}>
                <h3>Newsletter</h3>
                <p>Subscribe to our newsletter to stay updated.</p>
                <form className={styles.newsletterForm}>
                    <input type="email" placeholder="Enter your email" />
                    <button type="submit">Subscribe</button>
                </form>
            </div>
        </div>

        {/* Bottom bar with payment logos */}
        <div className={styles.footerBottom}>
            <div className={styles.footerLogo}>ShopU</div>
            <div className={styles.paymentLogos}>
                <img src="PaymentImage.png" alt="PayPalandVisa" />
            </div>
        </div>
    </footer>
);

export default Footer;
