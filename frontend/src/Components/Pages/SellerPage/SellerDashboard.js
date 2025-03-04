import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ReactCalendar from "react-calendar";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';  // Updated import
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import styles from "./SellerDashboard.module.css";

function SellerDashboard() {
  const navigate = useNavigate();

  // Calendar and Appointments states
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([
    { date: "2025-02-12", time: "09:00 AM", appointment: "Haircut for John Doe" },
    { date: "2025-02-12", time: "11:00 AM", appointment: "Math tutoring for Jane Smith" },
    { date: "2025-02-14", time: "02:00 PM", appointment: "Laptop repair for Mark Lee" },
    { date: "2025-02-14", time: "04:00 PM", appointment: "Study session for Sarah White" }
  ]);
  
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

  // Handle Send Reschedule Notice
  const handleSendRescheduleNotice = (appointment) => {
    // Simulate sending a reschedule notice (You can replace this with actual functionality)
    alert(`Notice sent to customer to reschedule: ${appointment.appointment}`);
  };

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

  return (
    <div className={styles.bg}>
    <Container className={styles.container}>
      <h1 className={styles.title}>Seller Dashboard</h1>

      {/* Revenue and Analytics Overview */}
      <Row>
        <Col md={6}>
          <Card className={styles.card}>
            <Card.Body>
              <Card.Title>Total Revenue</Card.Title>
              <h2 className={styles.totalRevenueText}>$745</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className={styles.card}>
            <Card.Body>
              <Card.Title>Daily Sales</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Appointments Section */}
      <section className={styles.section}>
  <h2>My Appointments</h2>

  {/* Flex Layout to Place Calendar and Appointments Side by Side */}
  <div className={styles.appointmentSection}>
    {/* Calendar */}
    <div className={styles.calendarContainer}>
      <ReactCalendar
        onChange={setDate}
        value={date}
        tileClassName="calendarTile"
        minDetail="month"
      />
    </div>

    {/* Appointment List */}
    <div className={styles.appointmentList}>
      <h3>Appointments for {date.toDateString()}</h3>
      <ul>
        {appointments
            .filter((appointment) => appointment.date === date.toISOString().split('T')[0])
            .map((appointment, index) => (
            <li key={index}>
                <span className={styles.appointmentTime}>{appointment.time}</span> - {appointment.appointment}
                <Button onClick={() => handleAddToGoogleCalendar(appointment)}>
                Add to Google Calendar
                </Button>
                <Button onClick={() => handleSendRescheduleNotice(appointment)}>
                Send Reschedule Notice
                </Button>
            </li>
            ))}
        </ul>

        </div>
    </div>
    </section>

    </Container>
    </div>
  );
}

export default SellerDashboard;
