// frontend/src/Components/Header/Header.js

import React, { useState } from 'react';
import { FaSearch, FaShoppingCart, FaHeart, FaBars, FaUser, FaTimes } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { useAuth0 } from '@auth0/auth0-react';

const Header = () => {
    const [showCategoriesPopup, setShowCategoriesPopup] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const { loginWithRedirect, logout, isAuthenticated, user, isLoading, error } = useAuth0();

    const toggleCategoriesPopup = () => {
        setShowCategoriesPopup(!showCategoriesPopup);
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const getActiveLinkClass = (path) => {
        return location.pathname === path ? styles.activeLink : '';
    };

    const handleAuthAction = () => {
        if (isAuthenticated) {
            navigate('/profile');
        } else {
            loginWithRedirect();
        }
    };

    const handleLogout = () => {
        logout({ returnTo: window.location.origin });
    };

    return (
        <div className={styles.headerWrapper}>
            <div className={styles.header}>
                <div className={styles.logoContainer} onClick={() => navigate('/home')}>
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
                    <div className={styles.icon} onClick={() => navigate('/cart')}>
                        <FaShoppingCart />
                        <span className={styles.cartCount}>3</span>
                    </div>
                    <div className={styles.icon} onClick={() => navigate('/favorites')}>
                        <FaHeart />
                    </div>
                    <div className={styles.icon} onClick={handleAuthAction}>
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
                    {!isLoading && !user && (
                        <>
                            <button className={styles.signIn} onClick={() => loginWithRedirect()}>Sign In</button>
                        </>
                    )}  

                  
                    {!isLoading && user &&(
                        <>
                            <button className={styles.signIn} onClick={handleLogout}>Logout</button>
                        </>
                    )}
                </div>
            </div>

            {/* Sidebar for User Info */}
            {isAuthenticated && (
                <div className={`${styles.sidebar} ${showSidebar ? styles.open : ''}`}>
                    <div className={styles.sidebarContent}>
                        <div className={styles.sidebarHeader}>
                            <h2>User Profile</h2>
                            <button className={styles.closeButton} onClick={toggleSidebar}>
                                <FaTimes />
                            </button>
                        </div>
                        <img
                            src={user.picture}
                            alt={user.name}
                            className={styles.profileImage}
                        />
                        <p><strong>Name:</strong> {user.name}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        {/* Add more user info as needed */}
                    </div>
                </div>
            )}
        </div>
    );

};

export default Header;
