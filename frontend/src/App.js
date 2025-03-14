import React, { useState, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';
import Favorites from './Components/Pages/Favorites/Favorites';
import Communities from './Components/Pages/Community/Community';
import CommunityHome from './Components/Pages/Community/CommunityHome';
import Marketplace from './Components/Pages/Marketplace/Marketplace';
import Banner from './Components/Common/Banner';
import Statistics from './Components/Common/Statistics';
import Home from './Components/Pages/Home/Home';
import Resources from './Components/Pages/Resources/Resources';
import Profile from './Components/Pages/Profile/Profile';
import SocialFeed from './Components/Pages/Feed/SocialFeed';
import CreateListingPage from './Components/Pages/CommonPages/CreateListingPage';
import EditImage from './Components/Pages/Feed/EditImage';
import PostDetails from './Components/Pages/Feed/PostDetails';
import Friends from './Components/Pages/Friends/Friends';
import BecomeASeller from './Components/Pages/SellerPage/becomeASeller';
import { AuthenticationGuard } from "./Components/authentication-guard";
import { useAuth0 } from '@auth0/auth0-react';
import CheckOut from './Components/Pages/CheckOut/CheckOut'; // Import CheckOut page
import MessagesPage from './Components/Pages/MessagesPage/MessagesPage';
import ChatContent from './Components/Pages/ChatContent/ChatContent';
import EmailVerificationRequired from './Components/Utilities/EmailVerificationRequired';
import AdminDashboard from './Components/Pages/Administration/AdminDashboard';
import SellerDashboard from './Components/Pages/SellerPage/SellerDashboard';
import ProtectedRoute from './Components/Common/ProtectedRoutes';

function App() {
  const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isEmailVerificationError =
    params.get('error') === 'access_denied' &&
    params.get('error_description')?.includes('verify your email');

  // Initialize state without checking `localStorage` initially
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for stored theme in localStorage on mount (this is done in useEffect)
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark');
    }
  }, []); // This runs only once when the component mounts

  // Apply the theme using useEffect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Toggle theme and store it in localStorage
  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (isEmailVerificationError) {
    return <EmailVerificationRequired />;
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div className={isSidebarOpen ? 'App body-shifted' : 'App'}>
      <div className="page-container">

        {/* Header */}
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} toggleDarkMode={toggleDarkMode} />

        <div className="content-wrapper">
          {/* Routing Setup */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/favorites" element={<AuthenticationGuard component={Favorites} />} />
            <Route path="/marketplace" element={<AuthenticationGuard component={Marketplace} />} />
            <Route path="/resources" element={<AuthenticationGuard component={Resources} />} />
            <Route path="/feed" element={<AuthenticationGuard component={SocialFeed} />} />
            <Route path="/create-item-listing" element={<AuthenticationGuard component={CreateListingPage} />} />
            <Route path="/create-service-listing" element={<AuthenticationGuard component={CreateListingPage} />} />
            <Route path="/friends" element={<AuthenticationGuard component={Friends} />} />
            <Route path="/community" element={<AuthenticationGuard component={Communities} />} />
            <Route exact path="/profile" element={<AuthenticationGuard component={Profile} />} />
            <Route exact path="/profile/:userId" element={<AuthenticationGuard component={Profile} />} />
            <Route path="/edit-image" element={<AuthenticationGuard component={EditImage} />} />
            <Route path="/post-details" element={<AuthenticationGuard component={PostDetails} />} />
            <Route path="/Become A Seller" element={<BecomeASeller />} />
            <Route path="/admin-dashboard" element={<AuthenticationGuard component={() => (<ProtectedRoute requiredPermissions={['admin:access', 'moderator:access']}><AdminDashboard /></ProtectedRoute>)} />} />
            <Route path="/seller-dashboard" element={<AuthenticationGuard component={SellerDashboard} />} />
            {/* New Checkout Page */}
            <Route path="/cart" element={<AuthenticationGuard component={CheckOut} />} />
            <Route path="/messages" element={<AuthenticationGuard component={MessagesPage} />} />
            <Route path="/community/:community_id" element={<AuthenticationGuard component={CommunityHome} />} />
            <Route path="/chat/:conversation_id" element={<AuthenticationGuard component={ChatContent} />} />
            <Route path="/feed/:post_id" element={<AuthenticationGuard component={SocialFeed} />} />

          </Routes>

        </div>
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default App;
