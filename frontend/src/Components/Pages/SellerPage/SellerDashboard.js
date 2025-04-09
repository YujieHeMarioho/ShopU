import React, { useEffect, useState} from "react";
import { Modal, Container, Row, Col, Card, Button } from "react-bootstrap";
import styles from "./SellerDashboard.module.css";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import SalesComparisonChart from "./salesComparisonChart";
import OrderHistoryPaymentInfo from "./OrderHistoryPaymentInfo";
import AppointmentsComponent from "./Appointments";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from '@auth0/auth0-react';

function SellerDashboard() {
  const [startDate, setStartDate] = useState(new Date());
  const [isSeller, setIsSeller] = useState(true);
  const [endDate, setEndDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const {  getAccessTokenSilently, user} = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfSeller = async () => {
      try {

        const token = await getAccessTokenSilently();
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/isSeller/${user.sub}`, {
           headers: {
              'Authorization': `Bearer ${token}`,
           },
        }); 
        const data = await response.json(); 
  
        if (data.hasListing === false) {
          setIsSeller(false);
          setShowModal(true); 
        }
      } catch (error) {
        console.error("Error checking seller status:", error);
        setIsSeller(false);
        setShowModal(true);
      }
    };
  
    checkIfSeller();
  }, []);

  return (
    <>
      {/* Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        navigate("/marketplace");
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Service Listing Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You need to create a service listing before accessing the seller dashboard.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => {
            setShowModal(false);
            navigate("/marketplace");
          }}>
            Go to Marketplace
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Seller Dashboard Content */}
      <div className={styles.bg}>
        <Container className={styles.container}>
          <h1 className={styles.title}>Seller Dashboard</h1>
          <Row>
            <Col>
              <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} />
              <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} />
            </Col>
          </Row>

          {/* Revenue and Analytics Overview */}
          <Row>
            <Col md={6}>
              <Card className={styles.card}>
                <Card.Body>
                  <OrderHistoryPaymentInfo />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className={styles.card}>
                <Card.Body>
                  <Card.Title>Daily Sales</Card.Title>
                  <SalesComparisonChart />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Appointments Section */}
          <section className={styles.section}>
            <h2>My Appointments</h2>
            <AppointmentsComponent />
          </section>

        </Container>
      </div>
    </>
  );
}

export default SellerDashboard;
