import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaShoppingCart, FaHeart, FaBars, FaUser, FaEnvelope } from 'react-icons/fa';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styles from './Header.module.css';
import { useAuth0 } from '@auth0/auth0-react';
import { PageLoader } from '../Pages/Loading/PageLoader';
import axios from 'axios';

const Header = () => {
    const [showCategoriesPopup, setShowCategoriesPopup] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [categories, setCategories] = useState([]);
    const [unreadTotal, setUnreadTotal] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();
    const { loginWithRedirect, logout, getAccessTokenSilently, isAuthenticated, user, isLoading } = useAuth0();

    // Update screen size on mount and resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        fetchFilters();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch filters for categories
    const fetchFilters = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/filters`);
            const rawData = await response.json();
            setCategories(rawData.categories || []);
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    }, []);

    useEffect(() => {
        fetchFilters();
    }, [fetchFilters]);

    const toggleCategoriesPopup = useCallback(() => {
        setShowCategoriesPopup(prevState => !prevState);
    }, []);

    const toggleSidebar = useCallback(() => {
        setShowSidebar(prevState => !prevState);
    }, []);

    const getActiveLinkClass = useCallback(
        (path) => (location.pathname === path ? styles.activeLink : ''),
        [location.pathname]
    );

    const handleLogout = useCallback(() => {
        logout({ returnTo: window.location.origin });
    }, [logout]);

    const handleAuthAction = useCallback(() => {
        if (isAuthenticated) {
            navigate('/profile');
        } else {
            loginWithRedirect();
        }
    }, [isAuthenticated, loginWithRedirect, navigate]);

    // Poll for total unread notifications (number is still tracked internally)
    useEffect(() => {
        if (!isAuthenticated || !user) return;
        const fetchUnreadTotal = async () => {
            try {
                const token = await getAccessTokenSilently();
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/api/messages/conversations/${encodeURIComponent(user.sub)}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const convs = response.data;
                let total = convs.reduce((acc, conv) => acc + (conv.unread_count || 0), 0);
                if (total > 99) total = 99; // cap at 99
                setUnreadTotal(total);
            } catch (err) {
                console.error("Error fetching unread count:", err);
            }
        };

        fetchUnreadTotal();
        const intervalId = setInterval(fetchUnreadTotal, 2000);
        return () => clearInterval(intervalId);
    }, [isAuthenticated, user, getAccessTokenSilently]);

    if (isLoading) {
        return <div>{PageLoader}</div>;
    }

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
                    {/* Message Icon with Notification Dot */}
                    <div className={styles.icon} onClick={() => navigate('/messages')}>
                        <FaEnvelope />
                        {unreadTotal > 0 && (
                            <span className={styles.unreadDot}></span>
                        )}
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
                            {categories.map((category) => (
                                <li key={category}>
                                    <Link to={`/marketplace?category=${encodeURIComponent(category)}`}>
                                        {category}
                                    </Link>
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

            {/* Sidebar (if any) */}
            {/* ... sidebar code ... */}
        </div>
    );
};

export default Header;
