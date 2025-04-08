import React, { useState, useEffect } from "react";
import ReactCalendar from "react-calendar";
import { Card, ListGroup, Row, Col, Button, Modal, Form } from "react-bootstrap";
import { useAuth0 } from "@auth0/auth0-react"; // Import useAuth0
import styles from "./Appointments.module.css"; // Import the CSS module
import ScheduleAppointmentModal from "./ScheduleAppointmentModal";
import "react-calendar/dist/Calendar.css"; // Import calendar styles

const AppointmentsComponent = () => {
  // State management for the selected date and appointments
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [listings, setListings] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const { getAccessTokenSilently, user } = useAuth0();
  const [reloadAppointments, setReloadAppointments] = useState(false);

  useEffect(() => {
    const fetchListingsAndServices = async () => {
      try {
        const token = await getAccessTokenSilently();

        // Fetch listings
        const listingsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/user/${user.sub}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!listingsResponse.ok) {
          throw new Error("Failed to fetch listings.");
        }

        const listingsData = await listingsResponse.json();
        setListings(listingsData);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching listings:", err);
      }
    };

    fetchListingsAndServices();
  }, [getAccessTokenSilently]);

  // Helper function to format date for comparison
  const formatDate = (date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0); // Remove time component
    return normalizedDate.toISOString().split("T")[0]; // Return only the date part (e.g., '2025-03-14')
  };

  // Helper function to format time
  const formatTime = (time) => {
    // Assuming time is in 'HH:mm:ss' format
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`; // Return only hours and minutes
  };


  // Calculate 2 weeks from today
  const today = new Date();
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(today.getDate() + 14); // Add 14 days to today

  // Get the appointments for the selected date
  const selectedAppointments = appointments.filter(
    (appointment) => formatDate(appointment.date) === formatDate(selectedDate)
  );

  // Filter and group upcoming appointments for the next 2 weeks
  const upcomingAppointments = appointments
    .filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= today && appointmentDate <= twoWeeksFromNow;
    })
    .reduce((acc, appointment) => {
      const date = formatDate(appointment.date); // Format the date for grouping
      if (!acc[date]) acc[date] = [];
      acc[date].push(appointment);
      return acc;
    }, {});

  const upcomingList = Object.entries(upcomingAppointments).map(([date, appointments]) => ({
    date,
    count: appointments.length,
  }));

  // Filter and sort deliverable services
  const deliverableServices = appointments
    .filter((appointment) => appointment.service_type === "deliverable")
    .map((appointment) => ({
      ...appointment,
      remainingDays: Math.ceil((new Date(appointment.date) - new Date()) / (1000 * 60 * 60 * 24)),
    }))
    .sort((a, b) => a.remainingDays - b.remainingDays); // Sort by remaining days in ascending order

  // Fetch appointments from the backend
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = await getAccessTokenSilently(); // Get the access token
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/services/${user.sub}`, {
          headers: {
            'Authorization': `Bearer ${token}`, // Send the token in the request header
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch appointments.");
        }

        const data = await response.json();
        setAppointments(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }

      if (reloadAppointments) {
        fetchAppointments();
        setReloadAppointments(false); 
      }
    };

    fetchAppointments();
  }, [getAccessTokenSilently, reloadAppointments]); // Ensure to fetch appointments when the component mounts

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const handleRescheduleButtonClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    console.log(selectedAppointment)
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/services/appointment/${selectedAppointment.service_id}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newDate, newTime }),
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule appointment');
      }

      alert('Appointment rescheduled successfully!');
      setShowRescheduleModal(false);
      setReloadAppointments(true)
      setNewDate('');
      setNewTime('');
    } catch (err) {
      alert('Failed to reschedule appointment');
      console.error(err);
    }
  };

  const cancelAppointment = async (appointment) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/services/appointment/${appointment.service_id}/cancel`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok && appointment.customer_id != null) {
        const conversationResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/conversations/${user.sub}/${appointment.customer_id}/find`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const conversationData = await conversationResponse.json();
        console.log(conversationData);

        if (!conversationResponse.ok) {
          throw new Error(conversationData.message || 'Failed to create conversation');
        }


        const messageData = {
          content: `Your appointment for ${appointment.service_name} @ ${formatDate(appointment.date)} ${formatTime(appointment.time)} has been canceled`,
          senderId: user.sub,
        };

        await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/messages/${conversationData.conversation_id}/messages`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData),
        });
      }

      alert('Appointment Canceled!');

      setReloadAppointments(true)
    } catch (err) {
      alert('Failed to reschedule appointment');
      console.error(err);
    }
  }

  return (
    <div className={styles.container}>
      <Row>
        {/* Calendar (Left side) */}
        <Col md={4}>
          <Card className={styles.card}>
            <Card.Body>
              <h3>Appointments Calendar</h3>
              <ReactCalendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileClassName={({ date, view }) => {
                  const dateString = formatDate(date);
                  // Highlight days with appointments
                  const hasAppointments = appointments.some(
                    (appointment) => formatDate(appointment.date) === dateString
                  );
                  const isCurrentDay = formatDate(date) === formatDate(new Date());

                  if (isCurrentDay) {
                    return styles.highlightToday;
                  }
                  if (hasAppointments) {
                    return styles.highlightAppointments;
                  }
                  return null;
                }}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Appointments for Selected Day (Right side) */}
        <Col md={8}>
          <Card className={styles.card}>
            <Card.Body>
              <h3>Appointments for {selectedDate.toDateString()}</h3>
              <Button onClick={() => setShowScheduleModal(true)}>Schedule Appointment</Button>
              <ListGroup>
                {appointments.filter(
                  (appointment) => formatDate(appointment.date) === formatDate(selectedDate)
                ).length > 0 ? (
                  appointments
                    .filter((appointment) => formatDate(appointment.date) === formatDate(selectedDate))
                    .map((appointment, index) => (
                      <ListGroup.Item key={index}>
                        <strong>{appointment.time}</strong> - {appointment.service_name} for{" "}
                        <strong>{appointment.customer_name ? appointment.customer_name : "Unbooked"}</strong>
                        <Button
                          variant="warning"
                          size="sm"
                          className="float-right"
                          onClick={() => handleRescheduleButtonClick(appointment)}
                        >
                          Reschedule
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="float-right"
                          onClick={() => cancelAppointment(appointment)}>
                          Cancel
                        </Button>
                      </ListGroup.Item>
                    ))
                ) : (
                  <ListGroup.Item>No appointments scheduled.</ListGroup.Item>
                )}
              </ListGroup>

            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Upcoming Appointments (Below the list) */}
      <Card className="mt-4">
        <Card.Body>
          <h3>Upcoming Appointments (Next 2 Weeks)</h3>
          <ListGroup>
            {upcomingList.length > 0 ? (
              upcomingList.map((item, index) => (
                <ListGroup.Item key={index}>
                  <strong>{new Date(item.date).toLocaleDateString()}</strong>: {item.count} appointment(s)
                </ListGroup.Item>
              ))
            ) : (
              <ListGroup.Item>No upcoming appointments in the next 2 weeks.</ListGroup.Item>
            )}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Deliverable Services */}
      <Card className="mt-4">
        <Card.Body>
          <h3>Deliverable Services</h3>
          <ListGroup>
            {deliverableServices.length > 0 ? (
              deliverableServices.map((service, index) => (
                <ListGroup.Item key={index}>
                  <strong>{service.service_name}</strong> for {service.customer_name} -{" "}
                  {service.remainingDays === 0 ? <strong>Due Today</strong> : `${service.remainingDays} day(s) remaining`}
                </ListGroup.Item>
              ))
            ) : (
              <ListGroup.Item>No deliverable services at the moment.</ListGroup.Item>
            )}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Reschedule Modal */}
      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reschedule Appointment</Modal.Title>
          This only sends a reschedule notice and a proposed time, your customer will choose their rescheduled time according to your set availability
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formNewDate">
              <Form.Label>Propose New Date</Form.Label>
              <Form.Control
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formNewTime">
              <Form.Label>Propose New Time</Form.Label>
              <Form.Control
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRescheduleModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleRescheduleSubmit}>
            Reschedule Appointment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Schedule Appointment Modal */}
      <ScheduleAppointmentModal
        show={showScheduleModal}
        listings={listings}
        selectedDate={selectedDate}
        onHide={() => setShowScheduleModal(false)}
        setReloadAppointments
      />
    </div>
  );
};

export default AppointmentsComponent;
