import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useAuth0 } from "@auth0/auth0-react"; // Import useAuth0

const ScheduleAppointmentModal = ({ show, onHide, listings, selectedDate, setReloadAppointments }) => {
  const [selectedListing, setSelectedListing] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const { getAccessTokenSilently, user } = useAuth0();

  // Fetch services based on selected listing
  useEffect(() => {
    if (selectedListing) {
      fetchServices(selectedListing);
    }
  }, [selectedListing]);

  const fetchServices = async () => {
    try {

      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/${selectedListing}/services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };


  const handleSubmit = async () => {
    if (!selectedListing || !selectedService || !appointmentTime || !estimatedTime) {
      alert("Please fill out all fields.");
      return;
    }

    const requestData = {
      date: selectedDate,
      time: appointmentTime,
      service_name: selectedService.service_name,
      customer_name: '',
      estimated_time: estimatedTime,
      service_type: 'service', //defaulted for now
      price: selectedService.service_price,
      service_owner: user.sub, 
      service_listing_id: selectedService.service_id
    };

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/services/create`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Failed to create service");
      }

      alert("Service successfully created!");

      // Clear form fields
      setSelectedListing("");
      setSelectedService(null);
      setAppointmentTime("");
      setEstimatedTime("");
      setReloadAppointments(true);
      onHide();
    } catch (error) {
      console.error("Error Creating Service Appointment:", error);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Schedule New Appointment on {new Date(selectedDate).toLocaleDateString()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Select Listing */}
          <Form.Group controlId="formListing">
            <Form.Label>Select Listing</Form.Label>
            <Form.Control
              as="select"
              value={selectedListing}
              onChange={(e) => setSelectedListing(e.target.value)}
            >
              <option value="">Select a Listing</option>
              {listings
                .filter((listing) => listing.item_type === 'service')
                .map((listing) => (
                  <option key={listing.listing_id} value={listing.listing_id}>
                    {listing.title}
                  </option>
                ))}
            </Form.Control>
          </Form.Group>

          {/* Select Service (only show after selecting a listing) */}
          {selectedListing && (
            <Form.Group controlId="formService">
              <Form.Label>Select Service</Form.Label>
              <Form.Control
                as="select"
                value={selectedService ? JSON.stringify(selectedService) : ""} 
                onChange={(e) => setSelectedService(e.target.value ? JSON.parse(e.target.value) : null)} 
              >
                <option value="">Select a Service</option>
                {services.length > 0 ? (
                  services.map((service) => (
                    <option key={service.id} value={JSON.stringify(service)}>
                      ${service.service_price} {service.service_name}
                    </option>
                  ))
                ) : (
                  <option value="">No services available</option>
                )}
              </Form.Control>
            </Form.Group>
          )}

          {/* Appointment Time */}
          <Form.Group controlId="formTime">
            <Form.Label>Time</Form.Label>
            <Form.Control
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
            />
          </Form.Group>

          {/* Estimated Time */}
          <Form.Group controlId="formEstimated">
            <Form.Label>Estimated Time (in minutes)</Form.Label>
            <Form.Control
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button variant="primary" onClick={handleSubmit}>Schedule Appointment</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ScheduleAppointmentModal;
