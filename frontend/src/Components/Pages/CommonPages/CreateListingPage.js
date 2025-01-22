import React, { useState, useEffect } from 'react';
import { Button, Form, Row, Col, Container, Card, Carousel, FormGroup, FormLabel, FormSelect } from 'react-bootstrap';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import itemStyles from './CreateItemListingPage.module.css';
import serviceStyles from './CreateServiceListingPage.module.css';
import { useAuth0 } from '@auth0/auth0-react';

const CreateListingPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    condition: '',
    description: '',
    price: '',
    tags: '',
    location: '',
    deliveryType: 'Pickup',
    images: [],
    businessName: '',
    services: [{ name: '', estimatedTime: '', price: '' }],
    contactDetails: { phone: '', email: '' },
    appointmentBased: false,
    availability: new Date(),
  });

  const [isServicePage, setIsServicePage] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [categories, setCategories] = useState([]);
  const { getAccessTokenSilently } = useAuth0();
  const currentStyles = isServicePage ? serviceStyles : itemStyles;

  useEffect(() => {
    const currentPath = window.location.pathname;
    setIsServicePage(currentPath.includes('service'));
  }, []);

  useEffect(() => {
    // Fetch the most recent listings from the server
    const fetchCategories = async () => {
      try {
        const token = await getAccessTokenSilently();

        const response = await fetch('http://localhost:8080/api/marketplace/categories', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const rawData = await response.json();
        
        const formattedData = rawData.map((category_name, index) => ({
          category_id: index + 1,
          name: category_name
        }));
;
        setCategories(formattedData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      contactDetails: { ...prevData.contactDetails, [name]: value },
    }));
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...formData.services];
    updatedServices[index][field] = value;
    setFormData((prevData) => ({ ...prevData, services: updatedServices }));
  };

  const addService = () => {
    setFormData((prevData) => ({
      ...prevData,
      services: [...prevData.services, { name: '', estimatedTime: '', price: '' }],
    }));
  };

  const removeService = (index) => {
    setFormData((prevData) => ({
      ...prevData,
      services: prevData.services.filter((_, i) => i !== index),
    }));
  };

  const handleAvailabilityChange = (date) => {
    setFormData((prevData) => ({ ...prevData, availability: date }));
  };

  const handleImages = (e) => {
    const validImageFormats = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => validImageFormats.includes(file.type));
  
    if (validFiles.length < files.length){
      alert("Certain files were not added because they are not in a supported format (JPEG, PNG, JPG, GIF)");
    }
  
    setFormData((prevData) => ({
      ...prevData,
      images: validFiles, // Set the images to the new selection, replacing the previous ones
    }));
  };

  const uploadImages = async (images) => {
    try {
      const formData = new FormData();

      // Appending files to formData
      images.forEach((image) => formData.append('images', image));
      
      const token = await getAccessTokenSilently();
      const response = await fetch('http://localhost:8080/api/listings/uploadImages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Failed to upload images: ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Files uploaded: ' + JSON.stringify(data.files));
      return data.files; // Assuming the backend returns an array of URLs
    } catch (error) {
      console.error('Error uploading images:', error);
      return [];
    }
  };

  const validateForm = () => {
    const requiredFields = isServicePage
      ? ['businessName', 'description', 'contactDetails.phone', 'contactDetails.email']
      : ['title', 'description', 'price', 'location', 'deliveryType'];

    for (let field of requiredFields) {
      const fieldValue = field.includes('.')
        ? field.split('.').reduce((o, key) => (o ? o[key] : null), formData)
        : formData[field];
      if (!fieldValue) {
        return false;
      }
    }

    if (isServicePage && formData.services.some(service => !service.name || !service.price || (formData.appointmentBased && !service.estimatedTime))) {
      return false;
    }

    if (formData.images.length === 0) {
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert("Please fill in all required fields, including uploading an images.");

      return;
    }

    const formDataToSubmit = new FormData();
    setIsButtonDisabled(true);

    try { 
      const uploadedImages = await uploadImages(formData.images);

      if (uploadedImages.length === 0){
        alert('Failed to upload image(s). Please Try Again');
        return
      }

      formDataToSubmit.append('images', JSON.stringify(uploadedImages));
    } catch (error) {
      console.error('Failed to upload image(s)', error);
    }


    if (isServicePage) {
      formDataToSubmit.append('title', formData.businessName);
      formDataToSubmit.append('description', formData.description);
      formDataToSubmit.append('category', formData.category); 
      formDataToSubmit.append('type', formData.type || 'service'); // Default type
      formDataToSubmit.append('rating', formData.rating || 0); // Default rating
      formDataToSubmit.append('price', formData.services[1].price);
      formDataToSubmit.append('condition', formData.condition || 'New'); // Needs to be added to the form defualting to new for now
    }
    else {
      formDataToSubmit.append('title', formData.title);
      formDataToSubmit.append('description', formData.description);
      formDataToSubmit.append('category', formData.category); 
      formDataToSubmit.append('type', formData.type || 'item'); // Default type
      formDataToSubmit.append('rating', formData.rating || 0); // Default rating
      formDataToSubmit.append('price', formData.price);
      formDataToSubmit.append('condition', formData.condition) 
    }

    const jsonString = JSON.stringify(Object.fromEntries(formDataToSubmit.entries()));

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/listings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: jsonString,
      });

      if (response.ok) {
        alert('Listing created successfully!');
        window.location.href = '/marketplace';
      } else {
        const error = await response.json();
        alert(`Failed to create listing: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
    }
  };


  return (
    <Container className={currentStyles.createListingPage}>
      <h2 className={currentStyles.listingHeader}>{isServicePage ? 'Create Service Listing' : 'Create Item Listing'}</h2>
      <Row>
        {/* Form Inputs */}
        <Col md={6}>
          <Form>
            {isServicePage ? (
              <>
                <Form.Group controlId="businessName">
                  <Form.Label>Business Name</Form.Label>
                  <Form.Control type="text" name="businessName" value={formData.businessName} onChange={handleChange} />
                </Form.Group>
                <Form.Group controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" name="description" value={formData.description} onChange={handleChange} />
                </Form.Group>
                <FormGroup controlId="category">
                  <FormLabel>Category</FormLabel>
                  <FormSelect name="category" value={formData.category} onChange={handleChange}>
                    <option value="" disabled hidden>Select A Category</option>
                    {categories.map(category => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.name}
                      </option>
                    ))}
                  </FormSelect>
                </FormGroup>
                {/* Appointment Based Toggle */}
                <Form.Group controlId="appointmentBased">
                  <Form.Check
                    type="checkbox"
                    label="Appointment Based Service"
                    checked={formData.appointmentBased}
                    onChange={() => setFormData((prevData) => ({ ...prevData, appointmentBased: !prevData.appointmentBased }))}
                  />
                </Form.Group>

                {/* Offered Services Section */}
                <Form.Group controlId="services">
                  <Form.Label>Offered Services</Form.Label>
                  {formData.services.map((service, index) => (
                    <div key={index} className="d-flex align-items-center mb-2">
                      <Form.Control
                        type="text"
                        placeholder="Service Name"
                        value={service.name}
                        onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                      />
                      {formData.appointmentBased && (
                        <Form.Control
                          type="number"
                          placeholder="Estimated Time (hrs)"
                          value={service.estimatedTime}
                          onChange={(e) => handleServiceChange(index, 'estimatedTime', e.target.value)}
                          className="ml-2"
                        />
                      )}
                      <Form.Control
                        type="number"
                        placeholder="Price"
                        value={service.price}
                        onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                        className="ml-2"
                      />
                      <Button
                        variant="danger"
                        onClick={() => removeService(index)}
                        className="ml-2"
                      >
                        X
                      </Button>
                    </div>
                  ))}
                  <Button variant="secondary" onClick={addService}>Add Another Service</Button>
                </Form.Group>

                {formData.appointmentBased && (
                  <Calendar value={formData.availability} onChange={handleAvailabilityChange} />
                )}

                {/* Contact Details */}
                <Form.Group controlId="contactPhone">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control type="text" name="phone" value={formData.contactDetails.phone} onChange={handleContactChange} />
                </Form.Group>
                <Form.Group controlId="contactEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" name="email" value={formData.contactDetails.email} onChange={handleContactChange} />
                </Form.Group>
              </>
            ) : (
              <>
                <Form.Group controlId="title">
                  <Form.Label>Title</Form.Label>
                  <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} />
                </Form.Group>
                <Form.Group controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" name="description" value={formData.description} onChange={handleChange} />
                </Form.Group>
                <FormGroup controlId="category">
                  <FormLabel>Category</FormLabel>
                  <FormSelect name="category" value={formData.category} onChange={handleChange}>
                    <option value="" disabled hidden>Select A Category</option>
                    {categories.map(category => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.name}
                      </option>
                    ))}
                  </FormSelect>
                </FormGroup>
                <FormGroup controlId="condition">
                  <FormLabel>Condition</FormLabel>
                  <FormSelect placeholder="Select A Condition" name="condition" value={formData.condition} onChange={handleChange}>
                    <option value="" disabled hidden>Select A Condition</option>
                    <option value='New'>New</option>
                    <option value='Used'>Used</option>
                  </FormSelect>
                </FormGroup>
                <Form.Group controlId="price">
                  <Form.Label>Price</Form.Label>
                  <Form.Control type="number" name="price" value={formData.price} onChange={handleChange} />
                </Form.Group>
                <Form.Group controlId="tags">
                  <Form.Label>Tags</Form.Label>
                  <Form.Control type="text" name="tags" value={formData.tags} onChange={handleChange} />
                </Form.Group>
                <Form.Group controlId="location">
                  <Form.Label>Location</Form.Label>
                  <Form.Control type="text" name="location" value={formData.location} onChange={handleChange} />
                </Form.Group>
                <Form.Group controlId="deliveryType">
                  <Form.Label>Delivery Type</Form.Label>
                  <Form.Control as="select" name="deliveryType" value={formData.deliveryType} onChange={handleChange}>
                    <option value="Pickup">Pickup</option>
                    <option value="Delivery">Delivery</option>
                  </Form.Control>
                </Form.Group>
              </>
            )}
            <Form.Group controlId="images">
              <Form.Label>Upload Images</Form.Label>
              <Form.Control type="file" multiple onChange={handleImages} accept="image/jpeg, image/png, image/jpg, image/gif"/>
            </Form.Group>
            {/* Create Listing Button */}
            <Button variant="primary" onClick={handleSubmit} disabled={isButtonDisabled}>Create Listing</Button>
          </Form>
        </Col>
        <Col md={6}>
          <h3>Preview</h3>
          <Card className="mb-3">
            {formData.images.length > 0 && (
              <Carousel>
                {formData.images.map((image, index) => {
                  const fileURL = typeof image === 'string' ? image : URL.createObjectURL(image);
                  return (
                    <Carousel.Item key={index}>
                      <div className="position-relative">
                        <img
                          className="d-block w-100"
                          src={fileURL} // Use the generated or provided URL
                          alt={`Preview ${index}`}
                        />
                      </div>
                    </Carousel.Item>
                  );
                })}
              </Carousel>
            )}
            <Card.Body>
              {isServicePage ? (
                <>
                  <Card.Title>{formData.businessName}</Card.Title>
                  <Card.Text>
                    <strong>Description:</strong> {formData.description}
                  </Card.Text>
                  <Card.Text><strong>Offered Services:</strong></Card.Text>
                  {formData.services.map((service, index) => (
                    <Card.Text key={index}>
                      {service.name} - {formData.appointmentBased ? `${service.estimatedTime} hrs, ` : ''}{service.price}
                    </Card.Text>
                  ))}
                  {formData.appointmentBased && (
                    <Card.Text><strong>Availability:</strong> {formData.availability.toLocaleDateString()}</Card.Text>
                  )}
                  <Card.Text>
                    <strong>Contact:</strong> {formData.contactDetails.phone}, {formData.contactDetails.email}
                  </Card.Text>
                </>
              ) : (
                <>
                  <Card.Title>{formData.title}</Card.Title>
                  <Card.Text><strong>Description:</strong> {formData.description}</Card.Text>
                  <Card.Text><strong>Price:</strong> ${formData.price}</Card.Text>
                  <Card.Text><strong>Tags:</strong> {formData.tags}</Card.Text>
                  <Card.Text><strong>Location:</strong> {formData.location}</Card.Text>
                  <Card.Text><strong>Delivery Type:</strong> {formData.deliveryType}</Card.Text>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateListingPage;
