import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import styles from "./ReportModal.module.css";

const ReportModal = ({ show, onHide, onSubmit, itemType }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!reason) {
      alert('Please select a reason for reporting');
      return;
    }
    onSubmit(reason, description);
    setReason('');
    setDescription('');
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title className={styles.modalTitle}>Report {itemType}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label className={styles.modalLabel}>Reason for reporting</Form.Label>
            <Form.Control 
              as="select" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Select a reason</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="spam">Spam</option>
              <option value="offensive">Offensive language</option>
              <option value="misinformation">Misinformation</option>
              <option value="other">Other</option>
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label className={styles.modalLabel}>Additional details (optional)</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide any additional context for your report"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Submit Report
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportModal;