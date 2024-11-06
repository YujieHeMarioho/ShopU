import React, { useState } from 'react';
import { FaSearch, FaShoppingCart, FaHeart, FaBars, FaUser, FaTimes } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
    const [showCategoriesPopup, setShowCategoriesPopup] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const location = useLocation();

    const toggleCategoriesPopup = () => {
        setShowCategoriesPopup(!showCategoriesPopup);
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const getActiveLinkClass = (path) => {
        return location.pathname === path ? styles.activeLink : '';
    };

    return (
        <div className={styles.headerWrapper}>
            <div className={styles.header}>
                <div className={styles.logoContainer}>
                    <img src="ShopULogo.png" alt="ShopU Logo" className={styles.logo} />
                    <span className={styles.brandName}>ShopU</span>
                </div>
                <div className={styles.searchContainer}>
                    <input type="text" className={styles.searchInput} placeholder="Search..." />
                    <button className={styles.searchButton}>
                        <FaSearch />
                    </button>
                </div>
                <div className={styles.iconContainer}>
                    <div className={styles.icon}>
                        <FaShoppingCart />
                        <span className={styles.cartCount}>3</span>
                    </div>
                    <div className={styles.icon}>
                        <FaHeart />
                    </div>
                    <div className={styles.icon} onClick={toggleSidebar}>
                        <FaUser />
                    </div>
                </div>
            </div>

            <div className={styles.secondLayer}>
                <button className={styles.categoriesButton} onClick={toggleCategoriesPopup}>
                    <FaBars className={styles.categoriesIcon} />
                    All Categories
                </button>

                {showCategoriesPopup && (
                    <div className={styles.categoriesPopup}>
                        <ul>
                            <li><a href="/furniture">Furniture</a></li>
                            <li><a href="/electronics">Electronics</a></li>
                            <li><a href="/clothing">Clothing & Accessories</a></li>
                            <li><a href="/hobbies">Hobbies</a></li>
                            <li><a href="/family">Family</a></li>
                            <li><a href="/free-stuff">Free Stuff</a></li>
                            <li><a href="/services">Services</a></li>
                            <li><a href="/events">Events</a></li>
                        </ul>
                    </div>
                )}

                <div className={styles.linksContainer}>
                    <a href="/home" className={getActiveLinkClass('/home')}>Home</a>
                    <a href="/marketplace" className={getActiveLinkClass('/marketplace')}>Marketplace</a>
                    <a href="/feed" className={getActiveLinkClass('/feed')}>Feed</a>
                    <a href="/community" className={getActiveLinkClass('/community')}>Community</a>
                    <a href="/resources" className={getActiveLinkClass('/resources')}>Resources</a>
                    <a href="/become-a-seller" className={getActiveLinkClass('/become-a-seller')}>Become a Seller</a>
                    <a href="/contact" className={getActiveLinkClass('/contact')}>Contact</a>
                </div>

                <div className={styles.contactPhoneAndText}>
                    <div className={styles.contactPhone}>Contact Us: (555) 123-4567</div>
                </div>

                <div className={styles.buttonsContainer}>
                    {!isLoggedIn ? (
                        <>
                            <button className={styles.signIn}>Sign In</button>
                            <button className={styles.register}>Register</button>
                        </>
                    ) : (
                        <button className={styles.signIn}>My Account</button>
                    )}
                </div>
            </div>

            {/* Sidebar for User Info */}
            <div className={`${styles.sidebar} ${showSidebar ? styles.open : ''}`}>
                <div className={styles.sidebarContent}>
                    <div className={styles.sidebarHeader}>
                        <h2>User Profile</h2>
                        <button className={styles.closeButton} onClick={toggleSidebar}>
                            <FaTimes />
                        </button>
                    </div>
                    <img
                        src="/path/to/profile-image.jpg" // Replace with the actual path to the user's profile image
                        alt="Profile"
                        className={styles.profileImage}
                    />
                    <p><strong>Name:</strong> John Doe</p>
                    <p><strong>Email:</strong> johndoe@example.com</p>
                    <p><strong>Orders:</strong> 5</p>
                    <p><strong>Favorites:</strong> 10</p>
                </div>
            </div>
        </div>
    );
};

export default Header;
