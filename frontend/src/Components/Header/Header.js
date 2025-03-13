import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaShoppingCart, FaHeart, FaBars, FaUser, FaEnvelope, FaTimes, FaSun, FaMoon, FaArrowLeft } from 'react-icons/fa';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styles from './Header.module.css';
import { useAuth0 } from '@auth0/auth0-react';
import { PageLoader } from '../Pages/Loading/PageLoader';
import axios from 'axios';

const Header = () => {
    const [showCategoriesPopup, setShowCategoriesPopup] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showProfileSidebar, setShowProfileSidebar] = useState(false); // Profile sidebar state
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [categories, setCategories] = useState([]);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [showMobileLinks, setShowMobileLinks] = useState(false);
    const [themeMode, setTheme] = useState(localStorage.getItem('theme') || 'light'); // Default theme is light

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

    useEffect(() => {
        setShowSidebar(false);
        setShowProfileSidebar(false);
        setShowMobileLinks(false);
    }, [location.pathname]);

    const handleNavClick = (path) => {
    if (location.pathname !== path) {
        navigate(path);
    }
        setShowSidebar(false); // Close the sidebar on click
    };

    

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

    const toggleSidebar = () => {
        setShowSidebar((prev) => !prev);
    };

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


    const detectSystemTheme = () => {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      };

    // Theme change handler
    const handleThemeChange = (mode) => {
        setTheme(mode);
        localStorage.setItem('theme', mode);
        if (mode === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    };

    useEffect(() => {
    if (themeMode === "system") {
        const systemTheme = detectSystemTheme();
        document.documentElement.setAttribute("data-theme", systemTheme);
    } else {
        document.documentElement.setAttribute("data-theme", themeMode);
    }
    }, [themeMode]);

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
                    <img src="/ShopULogo.png" alt="ShopU Logo" className={styles.logo} />
                    <span className={styles.brandName}>ShopU</span>
                </div>

                {/* Icons */}
                {!isMobile && (
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
                    <div className={styles.icon} onClick={() => setShowProfileSidebar(!showProfileSidebar)}>
                        <FaUser />
                    </div>
                </div> )}

                {/* Hamburger Menu for Mobile */}
                {isMobile && (
                <div className={styles.icon} onClick={toggleSidebar}>
                    <FaBars />
                </div>
                )}
            </div>

            {/* Fullscreen Sidebar for Mobile */}
            {isMobile && showSidebar && (
                <div className={styles.fullScreenSidebar}>
                    <button className={styles.closeButton} onClick={toggleSidebar}>
                        <FaTimes />
                    </button>
                    <div className={styles.sidebarContent}>
                        <div
                            className={styles.sidebarItem}
                            onClick={() => handleNavClick('/cart')}
                        >
                            <FaShoppingCart className={styles.sidebarIcon} />
                            <span>Cart</span>
                        </div>
                        <div
                            className={styles.sidebarItem}
                            onClick={() => handleNavClick('/favorites')}
                        >
                            <FaHeart className={styles.sidebarIcon} />
                            <span>Favorites</span>
                        </div>
                        <div
                            className={styles.sidebarItem}
                            onClick={() => handleNavClick('/messages')}
                        >
                            <FaEnvelope className={styles.sidebarIcon} />
                            <span>Messages</span>
                            {/* Example for unread notifications */}
                        </div>
                        <div
                            className={styles.sidebarItem}
                            onClick={() => handleNavClick('/profile')}
                        >
                            <FaUser className={styles.sidebarIcon} />
                            <span>Profile</span>
                        </div>
                    </div>
            </div>
            )}

            {/* Profile Sidebar */}
            {showProfileSidebar && (
                <div className={styles.profileSidebar}>
                    <button className={styles.closeButton} onClick={() => setShowProfileSidebar(false)}>
                        <FaTimes />
                    </button>
                    <div className={styles.profileContent}>
                        <div className={styles.profileSection}  onClick={() => {
                                    if (location.pathname !== '/profile') {
                                    navigate('/profile');
                                    setShowProfileSidebar(false);
                                    } else {
                                    setShowProfileSidebar(false);
                                    }
                                }}>
                            <img src={user?.picture || '/default-avatar.png'} alt="Profile" className={styles.profileImage} />
                            <span>{user?.name || 'Guest'}</span>
                        </div>

                        {/* "My Profile" Button */}
                        <div className={styles.profileButton}  onClick={() => {
                                if (location.pathname !== '/profile') {
                                navigate('/profile');
                                setShowProfileSidebar(false);
                                } else {
                                setShowProfileSidebar(false);
                                }
                            }}>
                            <FaUser className={styles.sidebarIcon} />
                            <span>My Profile</span>
                        </div>

                        <div className={styles.themeSection}>
                            <h4>Theme</h4>
                            <div className={styles.themeOptions}>
                                <button 
                                    onClick={() => handleThemeChange('light')} 
                                    className={themeMode === 'light' ? styles.active : ''}
                                >
                                    <FaSun /> Light
                                </button>
                                <button 
                                    onClick={() => handleThemeChange('dark')} 
                                    className={themeMode === 'dark' ? styles.active : ''}
                                >
                                    <FaMoon /> Dark
                                </button>
                                <button 
                                    onClick={() => handleThemeChange('system')} 
                                    className={themeMode === 'system' ? styles.active : ''}
                                >
                                    Sync with System
                                </button>
                            </div>
                        </div>
                        <div className={styles.logoutSection}>
                            <button onClick={handleLogout} className={styles.logoutButton}>
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Second Layer */}
            <div className={styles.secondLayer}>

                  {/* Mobile Dropdown Toggle */}
                    {isMobile && (
                        <button 
                            className={styles.mobileLinksToggle} 
                            onClick={() => setShowMobileLinks(prev => !prev)}
                        >
                            {showMobileLinks ? "Close Menu" : "Menu"}
                        </button>
                    )}

                {!isMobile && (
                <button
                    className={styles.categoriesButton}
                    onClick={toggleCategoriesPopup}
                    aria-label="Toggle Categories"
                >
                    <FaBars className={styles.categoriesIcon} />
                    All Categories
                </button>
                )}

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
                <div className={`${styles.linksContainer} ${isMobile && showMobileLinks ? styles.active : ""}`}>
                    {[
                        'Home',
                        'Marketplace',
                        'Feed',
                        'Community',
                        'Become A Seller',
                        'Friends',
                    ].map((link) => (
                        <a
                            key={link}
                            href={`/${link}`}
                            className={getActiveLinkClass(`/${link}`)}
                            onClick={() => setShowMobileLinks(false)}
                        >
                            {link.replace('-', ' ')}
                        </a>
                    ))}
                    {/* Move Auth Button Inside Mobile Menu */}
                    {isMobile && !isLoading && (
                        <button
                            className={styles.signIn}
                            onClick={() => {
                                isAuthenticated ? handleLogout() : loginWithRedirect();
                                setShowMobileLinks(false); // Close menu after action
                            }}
                        >
                            {isAuthenticated ? "Logout" : "Sign In"}
                        </button>
                    )}
                </div>

                {/* Auth Buttons */}
                {!isMobile && (<div className={styles.buttonsContainer}>
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
                </div> )}
            </div>
        </div>
    );
};

export default Header;
