// frontend/src/Components/Footer/Footer.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
    const [categories, setCategories] = useState([]); // State to store categories fetched from the API
    const [showAllCategories, setShowAllCategories] = useState(false);
    const maxDisplayCategories = 10;

    useEffect(() => {
        fetchFilters();
    }, []);

    // Fetch the most recent listings from the server
    // Fetch the most recent listings from the server
    const fetchFilters = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/filters`);
            const rawData = await response.json();

            const displayCategories = showAllCategories ? rawData.categories : rawData.categories.slice(0, maxDisplayCategories);


            // set all the filters with what gets returned
            setCategories(displayCategories || []);

        } catch (error) {
            console.error('Error fetching filters:', error);
        }

    }, []);


    return (
        <footer className={`${styles.footer} mt-auto py-3`}>
            <Container>
                <Row className="mb-3">
                    <Col md={4} className="mb-3 mb-md-0">
                        <h2 className={styles.logo}>ShopU</h2>
                        <p>Your one-stop shop for college essentials and more.</p>
                    </Col>
                    <Col md={4} className="mb-3 mb-md-0">
                        <h3>Categories</h3>
                        <ul className={`${styles.linkList} list-unstyled`}>
                            {categories.map((category) => (
                                <li key={category}>
                                    <Link to={`/marketplace?category=${encodeURIComponent(category)}`} className={styles.link}>{category}</Link>
                                </li>
                            ))}
                        </ul>
                    </Col>
                    <Col md={4}>
                        <h3>Support</h3>
                        <ul className={`${styles.linkList} list-unstyled`}>
                            <li><Link to="/help" className={styles.link}>Help & Support</Link></li>
                            <li><Link to="/terms" className={styles.link}>Terms & Conditions</Link></li>
                            <li><Link to="/privacy" className={styles.link}>Privacy Policy</Link></li>
                        </ul>
                    </Col>
                </Row>
                <Row className={`${styles.footerBottom} pt-3 border-top`}>
                    <Col xs={12} md={6} className="mb-2 mb-md-0">
                        <div className={styles.footerLogo}>ShopU</div>
                    </Col>
                    <Col xs={12} md={6} className="d-flex justify-content-md-end">
                        <div className={styles.paymentLogos}>
                            <img src="/PaymentImage.png" alt="Payment Methods" className="img-fluid" />
                        </div>
                    </Col>
                </Row>
            </Container>
        </footer>

    );
}
export default Footer;