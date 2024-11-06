import React, { useState } from 'react';
import './App.css';
import { NavBar } from './Components/NavBar';
import { Banner } from './Components/Banner';
import { Statistics } from './Components/Statistics';
import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // state for sidebar visibility

    const handleClick = () => {
        alert('Button clicked!');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className={isSidebarOpen ? 'App body-shifted' : 'App'}>
            <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
            <Banner />
            <Statistics />
            <Footer />
        </div>
    );
}

export default App;
