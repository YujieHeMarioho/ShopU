import multer from "multer";

// //this is storage to memory so we can quickly upload to the cloud instead of holding it disk
// const storage = multer.memoryStorage();

// //upload function
// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB file size limit
//   },
//   fileFilter: (req, file, cb) => {
//     console.log('File type:', file.mimetype);
//     const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
//     if (allowedMimeTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Invalid file type. Only JPEG, JPG, PNG, and GIF are allowed."));
//     }
//   },
// });

const storage = multer.memoryStorage({
    filename: (req, file, cb) => {
        console.log(file);
    }
})
const upload = multer({ storage: storage })

export default upload;
