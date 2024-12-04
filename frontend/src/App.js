// frontend/src/App.js

import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';
import Favorites from './Components/Pages/Favorites/Favorites';
import Marketplace from './Components/Pages/Marketplace/Marketplace';
import Banner from './Components/Common/Banner';
import Statistics from './Components/Common/Statistics';
import Home from './Components/Pages/Home/Home';
import Resources from './Components/Pages/Resources/Resources';
import Profile from './Components/Pages/Profile/Profile';
import PrivateRoute from './Components/Common/PrivateRoute';
import Auth0ProviderWithHistory from './auth0Provider';
import CreateListingPage from './Components/Pages/CommonPages/CreateListingPage';
import Friends from './Components/Pages/Friends/Friends';

function App() {
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
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/create-item-listing" element={<CreateListingPage />} />
          <Route path="/create-service-listing" element={<CreateListingPage />} />
          <Route path="/friends" element={<Friends />} />
          {/* Protected Route */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
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
