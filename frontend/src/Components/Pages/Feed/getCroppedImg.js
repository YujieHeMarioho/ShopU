export default function getCroppedImg(imageSrc, crop, rotation = 0, flipHorizontal = false, flipVertical = false, brightness = 100, contrast = 100) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous"; // Ensures CORS compatibility for external images

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.save(); // Save current state before transformations

      // Move to center for rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply flipping
      ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);

      // Move back after transformations
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Apply brightness & contrast
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      // Draw cropped image with transformations
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      ctx.restore(); // Restore previous state

      const dataUrl = canvas.toDataURL("image/jpeg");
      resolve(dataUrl);
    };

    image.onerror = (error) => reject(error);
  });
}
