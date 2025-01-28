import React, { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import getCroppedImg from "./getCroppedImg"; // Utility function to crop the image

function EditImage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { image } = location.state || {};
  
  // State for crop positioning and zoom level
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  // For tracking image dimensions
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Dynamically calculate crop box size based on image aspect ratio
  useEffect(() => {
    if (image) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        setImageDimensions({
          width: img.width,
          height: img.height,
        });

        // Set crop box to fit the image with a square aspect ratio
        const initialCropSize = Math.min(img.width, img.height); // Ensures the crop box fits within the image
        setCrop({
          x: (img.width - initialCropSize) / 2,
          y: (img.height - initialCropSize) / 2,
        });
      };
      img.src = image;
    }
  }, [image]);

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
            aspect={1} // Square crop
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: {
                width: "100%",
                height: "auto", // Make sure the cropper adjusts to the image's size
              },
            }}
          />
        </div>
      )}
      <Button className="me-2" onClick={() => navigate(-1)}>Back</Button>
      <Button variant="primary" onClick={handleNext}>Next</Button>
    </div>
  );
}

export default EditImage;
