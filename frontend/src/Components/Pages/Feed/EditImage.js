import React, { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button, Form } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import getCroppedImg from "./getCroppedImg";
import styles from './EditImage.module.css';  // Import CSS Module

function EditImage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { image } = location.state || {};

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.src = image;
    }
  }, [image]);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleNext = async () => {
    if (image && croppedAreaPixels) {
      try {
        const editedImage = await getCroppedImg(image, croppedAreaPixels, rotation, flipHorizontal, flipVertical, brightness, contrast);
        navigate("/post-details", { state: { image: editedImage } });
      } catch (error) {
        console.error("Error cropping the image:", error);
        alert("Failed to edit the image. Please try again.");
      }
    }
  };

  const resetEdits = () => {
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setBrightness(100);
    setContrast(100);
    setZoom(1);
  };

  return (
    <div className={styles.bg}>
    <div className={styles.container}>
      <h1>Edit Image</h1>
      {image && (
        <div className={styles.cropperContainer}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            flipHorizontal={flipHorizontal}
            flipVertical={flipVertical}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: {
                transform: `scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`,
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                maxWidth: '500px',
                display: 'flex',    // Center the cropper
                justifyContent: 'center',  // Center horizontally
                alignItems: 'center',  // Center vertically
              },
            }}
          />
        </div>
      )}
      <div className={styles.controls}>
        <Form.Label>Rotation</Form.Label>
        <Form.Range min="-180" max="180" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
        
        <Form.Label>Brightness</Form.Label>
        <Form.Range min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
        
        <Form.Label>Contrast</Form.Label>
        <Form.Range min="50" max="150" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
        
        <Form.Label>Zoom</Form.Label>
        <Form.Range min="1" max="3" value={zoom} step="0.1" onChange={(e) => setZoom(Number(e.target.value))} />

        <Button variant="secondary" onClick={() => setFlipHorizontal(!flipHorizontal)}>Flip Horizontal</Button>
        <Button variant="secondary" onClick={() => setFlipVertical(!flipVertical)}>Flip Vertical</Button>
        <Button variant="danger" onClick={resetEdits}>Reset</Button>
      </div>
      <div className={styles.buttonGroup}>
        <Button className="me-2" onClick={() => navigate(-1)}>Back</Button>
        <Button variant="primary" onClick={handleNext}>Next</Button>
      </div>
    </div>
    </div>
  );
}

export default EditImage;
