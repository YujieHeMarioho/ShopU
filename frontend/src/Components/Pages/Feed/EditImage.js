import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import getCroppedImg from "./getCroppedImg"; // Utility function to crop the image

function EditImage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { image } = location.state || {};
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleNext = async () => {
    if (image && croppedAreaPixels) {
      try {
        const editedImage = await getCroppedImg(image, croppedAreaPixels);
        navigate("/post-details", { state: { image: editedImage } });
      } catch (error) {
        console.error("Error cropping the image:", error);
        alert("Failed to edit the image. Please try again.");
      }
    }
  };
  

  return (
    <div>
      <h1>Edit Image</h1>
      {image && (
        <div style={{ width: "100%", height: 400, position: "relative" }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}
      <Button className="me-2" onClick={() => navigate(-1)}>Back</Button>
      <Button variant="primary" onClick={handleNext}>Next</Button>
    </div>
  );
}

export default EditImage;
