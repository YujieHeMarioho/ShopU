import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ReactCalendar from "react-calendar";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';  // Updated import
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import styles from "./SellerDashboard.module.css";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import SalesComparisonChart from "./salesComparisonChart";
import OrderHistoryPaymentInfo from "./OrderHistoryPaymentInfo";
import AppointmentsComponent from "./Appointments";

function SellerDashboard() {
  const navigate = useNavigate();

  // Calendar and Appointments states
  const [date, setDate] = useState(new Date());
  
  const [googleToken, setGoogleToken] = useState("");

  // Example daily sales data
  const dailySalesData = [
    { date: "2025-02-01", sales: 5 },
    { date: "2025-02-02", sales: 8 },
    { date: "2025-02-03", sales: 4 },
    { date: "2025-02-04", sales: 6 },
    { date: "2025-02-05", sales: 7 },
    { date: "2025-02-06", sales: 10 },
    { date: "2025-02-07", sales: 3 },
  ];

  // Google OAuth Login
  const handleGoogleLogin = (response) => {
    if (response.credential) {
      setGoogleToken(response.credential);
    }
  };

  const handleAddToGoogleCalendar = (appointment) => {
    if (googleToken) {
      const eventDetails = {
        summary: "Appointment",
        description: appointment.appointment,
        start: {
          dateTime: `${appointment.date}T09:00:00`,  // Example time, you can adjust
          timeZone: "America/New_York",
        },
        end: {
          dateTime: `${appointment.date}T10:00:00`,
          timeZone: "America/New_York",
        },
      };

      // Add the event to Google Calendar using API (OAuth Token required)
      fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?access_token=${googleToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventDetails),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Event Added: ", data);
        })
        .catch((error) => {
          console.error("Error adding event to Google Calendar: ", error);
        });
    }
  };



/**********************************
 * Appointment Editing and Deleting
 **********************************/

// Handle Edit Appointment
const handleEditAppointment = (appointment) => {
  // Open modal or navigate to an appointment editing page
  console.log("Editing appointment:", appointment);
};

// Handle Delete Appointment
const handleDeleteAppointment = (appointment) => {
  // Simulate deleting appointment (replace with actual API call)
  alert(`Appointment for ${appointment.appointment} has been deleted.`);
};



/**********************************
 * Appointment Reminders and Notifications
 **********************************/

  // Handle Send Reschedule Notice
  const handleSendRescheduleNotice = (appointment) => {
    // Simulate sending a reschedule notice (You can replace this with actual functionality)
    alert(`Notice sent to customer to reschedule: ${appointment.appointment}`);
  };


  const sendAppointmentReminder = (appointment) => {
    // Simulate sending reminder
    alert(`Reminder sent for ${appointment.appointment}`);
  };
  

/**********************************
 * Customizable Date Range for Sales Data
 **********************************/

  // Add state for date range
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // Filter sales data based on the selected date range
  const filteredSalesData = dailySalesData.filter((data) => {
    const date = new Date(data.date);
    return date >= startDate && date <= endDate;
  });

/**********************************
 * Product Listing Management
 **********************************/

 // Add Code to utilize Create Listing functionality





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
