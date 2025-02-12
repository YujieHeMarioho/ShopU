import { s3, pool, buckets } from '../pool.js';
import { jwtDecode } from 'jwt-decode';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const bucketName = buckets.listings;

//Endpoint for fetching rows
export const getAllListings = async (req, res) => {
  const query = `
        SELECT
          l.listing_id,
          l.user_id,
          l.title,
          l.description,
          c.name AS category,  -- Get the category name
          l.item_type,
          l.star_rating,
          l.price,
          ARRAY_AGG(li.file_key) AS file_keys 
        FROM
          listings l
        JOIN
          categories c ON l.category_id = c.category_id
        INNER JOIN
          listing_images li ON l.listing_id = li.listing_id
        GROUP BY
          l.listing_id, 
          l.title, 
          l.description, 
          c.name, 
          l.item_type, 
          l.star_rating, 
          l.price;
      `;

  try {
    const result = await pool.query(query);

    // Loop through each listing and generate signed URLs
    const listingsWithUrls = await Promise.all(
      result.rows.map(async (listing) => {
        // Generate pre-signed URLs for file_keys
        const signedUrls = await Promise.all(
          (listing.file_keys || []).map(async (fileKey) => {
            const command = new GetObjectCommand({
              Bucket: bucketName,
              Key: fileKey,
            });

            return getSignedUrl(s3, command, { expiresIn: 86400 }); // URL expires in 1 day
          })
        );

        // Return the listing with the signed URLs
        return {
          ...listing,
          file_keys: signedUrls,
        };
      })
    );

    res.status(200).json(listingsWithUrls);
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
    ARRAY_AGG(li.file_key) AS file_keys 
  FROM
    listings l
  JOIN
    categories c ON l.category_id = c.category_id
  INNER JOIN
    listing_images li ON l.listing_id = li.listing_id
  JOIN
    favorites f ON l.listing_id = f.listing_id
  WHERE
    f.user_id = $1 
  GROUP BY
    l.listing_id, 
    l.title, 
    l.description, 
    c.name, 
    l.item_type, 
    l.star_rating, 
    l.price;
`;

  try {
    const result = await pool.query(query, [userId]);

    // Loop through each listing and generate signed URLs
    const listingsWithUrls = await Promise.all(
      result.rows.map(async (listing) => {
        // Generate pre-signed URLs for file_keys
        const signedUrls = await Promise.all(
          (listing.file_keys || []).map(async (fileKey) => {
            const command = new GetObjectCommand({
              Bucket: bucketName,
              Key: fileKey,
            });

            return getSignedUrl(s3, command, { expiresIn: 86400 }); // URL expires in 1 day
          })
        );

        // Return the listing with the signed URLs
        return {
          ...listing,
          file_keys: signedUrls,
        };
      })
    );

    res.status(200).json(listingsWithUrls);
  } catch (err) {
    console.error('Error running query:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

//Endpoint for create a listing
export const createListing = async (req, res) => {
  try {
    const { title, description, category, type, rating, price, condition, images } = req.body;
    const parsedImages = images ? JSON.parse(images) : [];

    let userId;
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    try {
      const decodedToken = jwtDecode(token); // Decode the token
      userId = decodedToken.sub;
    } catch (err) {
      console.error('Error decoding token:', err);
      return res.status(401).json({ message: 'Invalid token' });
    }

    //database call to create listing in listing table
    const listingQuery = `
            INSERT INTO public.listings (title, description, category_id, item_type, star_rating, price, condition, date_posted, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
    const listingValues = [title, description, category, type, rating || 0, price, condition, new Date().toISOString(), userId];


    // Execute listings table query
    const listingResult = await pool.query(listingQuery, listingValues);

    for (const imageKey of parsedImages) {
      const imageQuery = `
              INSERT INTO public.listing_images (listing_id, file_key)
              VALUES ($1, $2)
          `;
      const imageValues = [listingResult.rows[0].listing_id, imageKey];

      // Execute image insertion query
      await pool.query(imageQuery, imageValues);
    }

    res.status(201).json(listingResult.rows[0]);
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const editListing = async (req, res) => {

};

export const deleteListing = async (req, res) => {
  try {
    const listingID = req.params.id;
    
    const deleteQuery = `
    DELETE FROM public.listings
    WHERE listing_id = $1;
    `;

    const fileKeyQuery = `
    SELECT file_key FROM public.listing_images
    WHERE listing_id = $1; 
    `;

    const result = await pool.query(fileKeyQuery, [listingID]);


    if (result.rows.length > 0) {
      await Promise.all(result.rows.map(async (file) => {
        if (!file.file_key) {
          console.error("File key is missing for listing:", file);
          return; 
        }

        const params = {
          "Bucket": bucketName,
          "Key": file.file_key
        };

        await s3.send(new DeleteObjectCommand(params));
      }));

    await pool.query(deleteQuery, [listingID]);

    return res.status(200).json({ message: "Listing deleted successfully" });
    }

  }
  catch (error) {
    console.error("Error deleting listing:", error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// //Endpoint for create a listing
// export const createServiceListing = async (req, res) => {
//   try {
//       const { title, description, category, type, rating, price, condition} = req.body;

//       let userId;
//       const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
//       try {
//           const decodedToken = jwtDecode(token); // Decode the token
//           userId = decodedToken.sub;
//       } catch (err) {
//           console.error('Error decoding token:', err);
//           return res.status(401).json({ message: 'Invalid token' });
//       }

//       //database call to create listing in listing table
//       const listingQuery = `
//           INSERT INTO public.listings (title, description, category_id, item_type, star_rating, price, condition, date_posted, user_id)
//           VALUES ($1, $2, 1, $3, $4, $5, $1, $6, $7, $8)
//           RETURNING *;
//       `;
//       const listingValues = [title, description, type, rating || 0, price, condition, new Date().toISOString(), userId];

//       // Execute listings table query
//       const listingResult = await pool.query(listingQuery, listingValues);

//       const imageQuery = `INSERT INTO public.listings`;

//       const imageValues = [];

//       res.status(201).json(listingQuery.rows[0]);
//   } catch (err) {
//       console.error('Error creating listing:', err);
//       res.status(500).json({ error: 'Database error' });
//   }
// };

export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      // Preproccess the images
      const buffer = await sharp(file.buffer).resize({ height: 1080, width: 1920, fit: "cover" }).toBuffer();

      //Create unique image names so no collusion within the bucket
      const fileName = `${uuidv4()}-${file.originalname}`;

      //upload params 
      const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.mimetype,
      };

      // Upload to S3
      await s3.send(new PutObjectCommand(params));

      uploadedFiles.push(fileName);
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

//Endpoint for fetching rows
export const getAllCategories = async (req, res) => {

  const queryCategories = 'SELECT * FROM public.categories';

  try {
    const result = await pool.query(queryCategories);

    // Transform the result an array of category names
    const categories = result.rows.map(row => row.name);

    res.status(200).json(categories);
  } catch (err) {
    console.error('Error running query:', err);
    res.status(500).json({ error: 'Database error' });
  }
};
