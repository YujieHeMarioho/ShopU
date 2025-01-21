import pool from '../pool.js';
import { jwtDecode } from "jwt-decode";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid"; 
import dotenv from 'dotenv';

dotenv.config();

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.BUCKET_ACCESS_KEY
const secretAccessKey = process.env.BUCKET_SECRET_KEY

const s3 = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey
  } 
});

//Endpoint for fetching rows
export const getAllListings = async (req, res) => {
    const query = `
        SELECT
          l.listing_id,
          l.title,
          l.description,
          c.name AS category,  -- Get the category name
          l.item_type,
          l.star_rating,
          l.price,
          l.image_url
        FROM
          listings l
        JOIN
          categories c ON l.category_id = c.category_id;
      `;
 
    try {
        const result = await pool.query(query);  
        res.status(200).json(result.rows); 
    } catch (err) {
        console.error('Error running query:', err);  
        res.status(500).json({ error: 'Database error' });  
    }
};

//Endpoint for fetching rows
export const getFavoritedListings = async (req, res) => {
  let userId;
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  try {
      const decodedToken = jwtDecode(token); // Decode the token
      userId = decodedToken.sub;
  } catch (err) {
      console.error('Error decoding token:', err);
      return res.status(401).json({ message: 'Invalid token' });
  }

    const query = `
        SELECT
          l.listing_id,
          l.title,
          l.description,
          c.name AS category,  -- Get the category name
          l.item_type,
          l.star_rating,
          l.price,
          l.image_url
        FROM
          listings l
        JOIN
          categories c ON l.category_id = c.category_id
        JOIN
          favorites f ON l.listing_id = f.listing_id
        WHERE
          f.user_id = $1; 
        `;
    
    try {
        const result = await pool.query(query, [userId]);  
        res.status(200).json(result.rows); 
    } catch (err) {
        console.error('Error running query:', err);  
        res.status(500).json({ error: 'Database error' });  
    }
};

//Endpoint for create a listing
export const createListing = async (req, res) => {
    try {
        const { title, description, category, type, rating, price, condition} = req.body;

        const imagePath = req.file ? req.file.path : 'http://localhost:3000/ShopULogo.png';

        let userId;
        const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
        try {
            const decodedToken = jwtDecode(token); // Decode the token
            userId = decodedToken.sub;
        } catch (err) {
            console.error('Error decoding token:', err);
            return res.status(401).json({ message: 'Invalid token' });
        }
      
        //database call to get category id

        const query = `
            INSERT INTO public.listings (title, description, category_id, item_type, star_rating, price, image_url, condition, date_posted, user_id)
            VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        const values = [title, description, type, rating || 0, price, imagePath, condition, new Date().toISOString(), userId];
        
        // Execute query
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating listing:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

export const uploadImages = async (req, res) => {
  console.log('Reached backend api, this is the amount of files: ' + req.files.length);
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      console.log(file);
      const fileKey = `${uuidv4()}-${file.originalname}`;
      const params = {
        Bucket: bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      // Upload to S3
      await s3.send(new PutObjectCommand(params));

      // Store the S3 URL in the response
      const fileUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${fileKey}`;
      uploadedFiles.push(fileUrl);
    }

    res.status(200).json({
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("Error uploading images:", err);
    res.status(500).json({ message: "Error uploading files", error: err });
  }
};

export default {createListing, getFavoritedListings, getAllListings, uploadImages};