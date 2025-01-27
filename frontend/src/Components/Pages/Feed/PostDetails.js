import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Button } from "react-bootstrap";

function PostDetails() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [tags, setTags] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve the edited image from the previous step
  const { image } = location.state || {};

  const handleSubmit = () => {
    // Post submission logic here
    alert("Post created successfully!");
    navigate("/Feed");
  };

  return (
    <div>
      <h1>Create Post Details</h1>
      {image && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h3>Edited Image Preview</h3>
          <img
            src={image}
            alt="Edited Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "10px",
            }}
          />
        </div>
      )}
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Link to Item</Form.Label>
          <Form.Control
            type="url"
            placeholder="Enter item link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Tags</Form.Label>
          <Form.Control
            type="text"
            placeholder="Add tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </Form.Group>
        <Button className="me-2" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Confirm
        </Button>
      </Form>
    </div>
  );
}

export default PostDetails;
