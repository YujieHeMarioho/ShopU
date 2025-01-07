import React from "react";
import Spinner from 'react-bootstrap/Spinner';
import './PageLoader.css';  // Import your custom CSS file

export const PageLoader = () => {
  return (
    <div className="loader">
      <Spinner animation="border" role="status" className="large-spinner">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
};