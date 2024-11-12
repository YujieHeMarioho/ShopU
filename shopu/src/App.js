import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';
import Marketplace from './Components/Pages/Marketplace/Marketplace';
import Banner from './Components/Common/Banner';
import Statistics from './Components/Common/Statistics';
import Home from './Components/Pages/Home/Home';
import Resources from './Components/Pages/Resources/Resources';
import CreateListingPage from './Components/Pages/CommonPages/CreateListingPage';

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
            <div className={isSidebarOpen ? 'App body-shifted' : 'App'}>
                <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

                {/* Routing Setup */}
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/create-item-listing" element={<CreateListingPage listingType="item" />} />
                    <Route path="/create-service-listing" element={<CreateListingPage listingType="service" />} />
                </Routes>

                {/* Footer */}
                <Footer />
            </div>
    );
}

export default App;

