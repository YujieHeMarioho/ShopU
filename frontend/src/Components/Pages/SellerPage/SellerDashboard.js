import React, { useState} from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import styles from "./SellerDashboard.module.css";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import SalesComparisonChart from "./salesComparisonChart";
import OrderHistoryPaymentInfo from "./OrderHistoryPaymentInfo";
import AppointmentsComponent from "./Appointments";

function SellerDashboard() {

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());



  return (
    <div className={styles.bg}>
    <Container className={styles.container}>
      <h1 className={styles.title}>Seller Dashboard</h1>
      <Row>
        <Col>
          <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} />
          <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} />
        </Col>
      </Row>
  {/* Render filteredSalesData in your chart */}
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
    <AppointmentsComponent/>
    </section>

    </Container>
    </div>
  );
}

export default SellerDashboard;
