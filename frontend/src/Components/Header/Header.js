// frontend/src/Components/Header/Header.js

import React, { useState } from 'react';
import { FaSearch, FaShoppingCart, FaHeart, FaBars, FaUser, FaTimes, FaEnvelope } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { useAuth0 } from '@auth0/auth0-react';

const Header = () => {
    const [showCategoriesPopup, setShowCategoriesPopup] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();

    // Update screen size on mount and resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768); // Set 768px as the mobile breakpoint
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize); // Update on resize

        return () => window.removeEventListener('resize', handleResize); // Cleanup
    }, []);

    // Memoized handlers
    const toggleCategoriesPopup = useCallback(() => {
        setShowCategoriesPopup(prevState => !prevState);
    }, []);

    const toggleSidebar = useCallback(() => {
        setShowSidebar(prevState => !prevState);
    }, []);

    const handleAuthAction = useCallback(() => {
        if (isAuthenticated) {
            navigate('/profile');
        } else {
            loginWithRedirect();
        }
    }, [isAuthenticated, loginWithRedirect, navigate]);

    const handleLogout = useCallback(() => {
        logout({ returnTo: window.location.origin });
    }, [logout]);

    const getActiveLinkClass = useCallback(
        (path) => (location.pathname === path ? styles.activeLink : ''),
        [location.pathname]
    );

    return (
        <div className={styles.headerWrapper}>
            <div className={styles.header}>
                {/* Logo */}
                <div
                    className={styles.logoContainer}
                    onClick={() => navigate('/home')}
                    aria-label="Navigate to Home"
                >
                    <img src="ShopULogo.png" alt="ShopU Logo" className={styles.logo} />
                    <span className={styles.brandName}>ShopU</span>
                </div>

                {/* Search */}
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search..."
                        aria-label="Search"
                    />
                    <button className={styles.searchButton} aria-label="Search">
                        <FaSearch />
                    </button>
                </div>

                {/* Icons */}
                <div className={styles.iconContainer}>
                    <div
                        className={styles.icon}
                        onClick={() => navigate('/cart')}
                        aria-label="View Cart"
                    >
                        <FaShoppingCart />
                        <span className={styles.cartCount}>3</span>
                    </div>
                    <div
                        className={styles.icon}
                        onClick={() => navigate('/favorites')}
                        aria-label="View Favorites"
                    >
                        <FaHeart />
                    </div>

                    {/* **Message Icon (Envelope Icon)** */}
                    <div className={styles.icon} onClick={() => navigate('/messages')}>
                        <FaEnvelope />
                        {/* Optional Unread Message Count */}
                        {/* <span className={styles.unreadCount}>5</span> */}
                    </div>
                    <div className={styles.icon} onClick={handleAuthAction}>
                        <FaUser />
                    </div>
                </div>
            </div>

            {/* Second Layer */}
            <div className={styles.secondLayer}>
                <button
                    className={styles.categoriesButton}
                    onClick={toggleCategoriesPopup}
                    aria-label="Toggle Categories"
                >
                    <FaBars className={styles.categoriesIcon} />
                    All Categories
                </button>

                {showCategoriesPopup && (
                    <div className={styles.categoriesPopup}>
                        <ul>
                            {[
                                'furniture',
                                'electronics',
                                'clothing',
                                'hobbies',
                                'family',
                                'free-stuff',
                                'services',
                                'events',
                            ].map((category) => (
                                <li key={category}>
                                    <a href={`/${category}`}>{category.replace('-', ' ')}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Links */}
                <div className={styles.linksContainer}>
                    {[
                        'Home',
                        'Marketplace',
                        'Feed',
                        'Community',
                        'Resources',
                        'Become A Seller',
                        'Contact',
                        'Friends',
                    ].map((link) => (
                        <a
                            key={link}
                            href={`/${link}`}
                            className={getActiveLinkClass(`/${link}`)}
                        >
                            {link.replace('-', ' ')}
                        </a>
                    ))}
                </div>

                {/* Contact Info */}
                <div className={styles.contactPhoneAndText}>
                    <div className={styles.contactPhone}>Contact Us: (555) 123-4567</div>
                </div>

                {/* Auth Buttons */}
                <div className={styles.buttonsContainer}>
                    {!isLoading && (
                        <>
                            {isAuthenticated ? (
                                <button
                                    className={styles.signIn}
                                    onClick={handleLogout}
                                    aria-label="Logout"
                                >
                                    Logout
                                </button>
                            ) : (
                                <button
                                    className={styles.signIn}
                                    onClick={loginWithRedirect}
                                    aria-label="Sign In"
                                >
                                    Sign In
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            {isAuthenticated && (
                <div
                    className={`${styles.sidebar} ${showSidebar ? styles.open : ''}`}
                    aria-hidden={!showSidebar}
                >
                    <div className={styles.sidebarContent}>
                        <div className={styles.sidebarHeader}>
                            <h2>User Profile</h2>
                            <button
                                className={styles.closeButton}
                                onClick={toggleSidebar}
                                aria-label="Close Sidebar"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <img
                            src={user.picture}
                            alt={`${user.name}'s Profile`}
                            className={styles.profileImage}
                        />
                        <p>
                            <strong>Name:</strong> {user.name}
                        </p>
                        <p>
                            <strong>Email:</strong> {user.email}
                        </p>
                        <button
                            className={styles.sidebarLink}
                            onClick={() => navigate('/profile')}
                        >
                            View Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Header;
