// frontend/src/App.js

import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';
import Favorites from './Components/Pages/Favorites/Favorites';
import Communities from './Components/Pages/Community/Community';
import Marketplace from './Components/Pages/Marketplace/Marketplace';
import Banner from './Components/Common/Banner';
import Statistics from './Components/Common/Statistics';
import Home from './Components/Pages/Home/Home';
import Resources from './Components/Pages/Resources/Resources';
import Profile from './Components/Pages/Profile/Profile';
import SocialFeed from './Components/Pages/Feed/SocialFeed';
import PrivateRoute from './Components/Common/PrivateRoute';
import Auth0ProviderWithHistory from './auth0Provider';
import CreateListingPage from './Components/Pages/CommonPages/CreateListingPage';
import Friends from './Components/Pages/Friends/Friends';
import { AuthenticationGuard } from "./Components/authentication-guard";
import { useAuth0 } from '@auth0/auth0-react';

function App() {
  const {loginWithRedirect, logout, user, isAuthenticated} = useAuth0;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Auth0ProviderWithHistory>
      <div className={isSidebarOpen ? 'App body-shifted' : 'App'}>
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Routing Setup */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/favorites" element={< AuthenticationGuard component= {Favorites} />} />
          <Route path="/marketplace" element={< AuthenticationGuard component= {Marketplace} />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/feed" element={<AuthenticationGuard component= {SocialFeed} />}/>
          <Route path="/create-item-listing" element={<CreateListingPage />} />
          <Route path="/create-service-listing" element={<CreateListingPage />} />
          <Route path="/friends" element={< AuthenticationGuard component= {Friends} />} />
          <Route path="/community" element={< AuthenticationGuard component= {Communities} />} />
          {/* Protected Route */}
          <Route
            path="/profile"
            element={
              <AuthenticationGuard component= {Profile} />
            }
          />
          {/* Add more routes as needed */}
        </Routes>

        {/* Footer */}
        <Footer />
      </div>
    </Auth0ProviderWithHistory>
  );
}

export default App;
