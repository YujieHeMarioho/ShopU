import { s3, pool, buckets } from '../pool.js';
import { jwtDecode } from 'jwt-decode';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const bucketName = buckets.listings;
const profileBucket = buckets.profile;

// Helper function to extract user_id from the token
const extractUserIdFromToken = (req) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  let user_id;
  
  if (!token) {
    throw new Error('Token is missing from the authorization header');
  }

  try {
    const decodedToken = jwtDecode(token);
    user_id = decodedToken.sub; // Assuming 'sub' is the user_id
  } catch (err) {
    console.error('Error decoding token:', err); // Log the error for debugging
    throw new Error('Invalid token');
  }

  return user_id;
};


//Endpoint for fetching rows
export const getAllListings = async (req, res) => {
  const query = `
    SELECT
      l.listing_id,
      l.user_id,
      l.title,
      l.description,
      c.name AS category,
      l.item_type,
      l.price,
      l.location,
      ARRAY_AGG(DISTINCT li.file_key) AS file_keys,
      u.name AS author,
      u.profile_image AS profile,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'service_id', ls.service_id,
            'service_name', ls.service_name,
            'service_price', ls.service_price
          )
        ) FILTER (WHERE ls.service_id IS NOT NULL), '[]'::JSON
      ) AS services
    FROM listings l
    JOIN categories c ON l.category_id = c.category_id
    JOIN users u ON l.user_id = u.user_id
    LEFT JOIN listing_images li ON l.listing_id = li.listing_id
    LEFT JOIN listing_services ls ON l.listing_id = ls.listing_id
    GROUP BY
      l.listing_id, 
      l.user_id,          
      l.title, 
      l.description, 
      c.name, 
      l.item_type, 
      l.price,
      l.location,
      u.name,               
      u.profile_image;
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

          if (listing.profile) {
            const command = new GetObjectCommand({
                Bucket: profileBucket,
                Key: listing.profile,
            });

            // Generate the signed URL
            listing.profile = await getSignedUrl(s3, command, { expiresIn: 86400 });
        }

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

//Endpoint for get the total count of num listings
export const getListingCount = async (req, res) => {
  const query = `SELECT COUNT(*) AS total_listings FROM listings;`;

  try {
    const result = await pool.query(query);
    res.status(200).json({ total_listings: result.rows[0].total_listings });
  } catch (err) {
    console.error('Error running query:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const getAUsersListings = async (req, res) => {
  const { user_id } = req.params;
  try {
    const listingsWithUrls = await getUserListings(user_id);
    res.status(200).json(listingsWithUrls);
  } catch (err) {
    console.error('Error running query:', err);
    res.status(500).json({ error: 'Database error' });
  }

}
//Endpoint for fetching rows
export const getAllUserListings = async (req, res) => {
  try {
    const userId = extractUserIdFromToken(req); // Extract user ID from token
    const listingsWithUrls = await getUserListings(userId);
    res.status(200).json(listingsWithUrls);
  } catch (err) {
    console.error('Error running query:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

const getUserListings = async (userId) => {
  const query = `
    SELECT
      l.listing_id,
      l.title,
      l.description,
      c.name AS category,
      l.item_type,
      l.price,
      l.user_id,
      l.location,
      ARRAY_AGG(li.file_key) AS file_keys 
    FROM
      listings l
    JOIN
      categories c ON l.category_id = c.category_id
    INNER JOIN
      listing_images li ON l.listing_id = li.listing_id
    WHERE
      l.user_id = $1
    GROUP BY
      l.listing_id, 
      l.title, 
      l.description, 
      c.name, 
      l.item_type, 
      l.price, 
      l.user_id;
  `;

  const result = await pool.query(query, [userId]);
  
  return Promise.all(
    result.rows.map(async (listing) => {
      const signedUrls = await Promise.all(
        (listing.file_keys || []).map(async (fileKey) => {
          const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
          });
          return getSignedUrl(s3, command, { expiresIn: 86400 });
        })
      );
      return {
        ...listing,
        file_keys: signedUrls,
      };
    })
  );
};


export const getUserListingsCount = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
      SELECT COUNT(*) AS listings_count
      FROM listings l
      WHERE l.user_id = $1;
    `;

    // Execute the query
    const result = await pool.query(query, [user_id]);

    const listingsCount = result.rows[0].listings_count;

    res.status(200).json({ count: listingsCount });
  } catch (err) {
    console.error('Error fetching user listings count:', err.message); // Log specific error message
    res.status(500).json({ error: err.message || 'Database error' });
  }
};





//Endpoint for fetching rows
export const getCommunityListings = async (req, res) => {
  let userId;
  const community_id = req.params.community_id;
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
        l.user_id,
        l.title,
        l.description,
        c.name AS category,  -- Get the category name
        l.item_type,
        l.price,
        l.location,
        ARRAY_AGG(li.file_key) AS file_keys 
      FROM
        listings l
      JOIN
        categories c ON l.category_id = c.category_id
      INNER JOIN
        listing_images li ON l.listing_id = li.listing_id
      INNER JOIN
        communities_listings cl ON l.listing_id = cl.listing_id
      WHERE
        cl.community_id = $1
      GROUP BY
        l.listing_id, 
        l.user_id,          -- NEW: Also group by the seller's ID
        l.title, 
        l.description, 
        c.name, 
        l.item_type,  
        l.price;
        
`;

try {
  const result = await pool.query(query, [community_id]);

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
export const createItemListing = async (req, res) => {
  try {
    const { title, description, category, type, price, condition, location, images } = req.body;
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
            INSERT INTO public.listings (title, description, category_id, item_type, price, condition, date_posted, user_id, location)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8,  $9)
            RETURNING *;
        `;
    const listingValues = [title, description, category, type,  price, condition, new Date().toISOString(), userId, location];


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

//Endpoint for create a listing
export const createServiceListing = async (req, res) => {
  try {
    const { title, description, category, type, price, condition, location, images, services } = req.body;

    let userId;
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    try {
      const decodedToken = jwtDecode(token); // Decode the token
      userId = decodedToken.sub;
    } catch (err) {
      console.error('Error decoding token:', err);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Database call to create listing in listings table
    const listingQuery = `
      INSERT INTO public.listings (title, description, category_id, item_type, price, condition, date_posted, user_id, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const listingValues = [title, description, category, type, price, condition, new Date().toISOString(), userId, location];

    // Execute listings table query
    const listingResult = await pool.query(listingQuery, listingValues);

    // Insert images into the listing_images table
    for (const imageKey of images) {
      const imageQuery = `
        INSERT INTO public.listing_images (listing_id, file_key)
        VALUES ($1, $2)
      `;
      const imageValues = [listingResult.rows[0].listing_id, imageKey];

      await pool.query(imageQuery, imageValues);
    }

    for (const service of services) {
      const serviceQuery = `
        INSERT INTO public.listing_services (listing_id, service_name, estimated_time, service_price)
        VALUES ($1, $2, $3, $4);
      `;
      const serviceValues = [
        listingResult.rows[0].listing_id, 
        service.name, 
        service.estimatedTime || 0, 
        service.price
      ];

      await pool.query(serviceQuery, serviceValues);
    }

    res.status(201).json(listingResult.rows[0]);
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const editListing = async (req, res) => {
  const listingID = req.params.id;
  const { title, price, description } = req.body;
  
  try {
    const updates = [];
    const values = [];
    let index = 1;

    if (title) {
      updates.push(`title = $${index}`);
      values.push(title);
      index++;
    }
    if (price) {
      updates.push(`price = $${index}`);
      values.push(price);
      index++;
    }
    if (description) {
      updates.push(`description = $${index}`);
      values.push(description);
      index++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(listingID);

    const query = `UPDATE public.listings SET ${updates.join(", ")} WHERE listing_id = $${index} RETURNING *`;

    const { rows } = await pool.query(query, values);

    res.json({ message: "Listing updated", listing: rows[0] });
  } catch (error) {
    console.error("Error updating listing:", error);
    res.status(500).json({ message: "Internal server error" });
  }
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

export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    console.log('did it hit the try')
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

// returns listings of the same category
export const getSimilarListings = async (req, res) => {
  const category = req.params.category;
  const listingID = req.params.id;
  
  // Query to get the category_id for the given category name
  const categoryQuery = `SELECT category_id FROM public.categories WHERE name = $1`;
  
  // Updated query to fetch additional data like location, author, profile, and services
  const query = `
    SELECT
        l.listing_id,
        l.user_id,
        l.title,
        l.description,
        c.name AS category,  -- Get the category name
        l.item_type,
        l.price,
        l.location,
        ARRAY_AGG(DISTINCT li.file_key) AS file_keys,
        u.name AS author,
        u.profile_image AS profile,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'service_id', ls.service_id,
              'service_name', ls.service_name,
              'service_price', ls.service_price
            )
          ) FILTER (WHERE ls.service_id IS NOT NULL), '[]'::JSON
        ) AS services
    FROM listings l
    JOIN categories c ON l.category_id = c.category_id
    JOIN users u ON l.user_id = u.user_id
    LEFT JOIN listing_images li ON l.listing_id = li.listing_id
    LEFT JOIN listing_services ls ON l.listing_id = ls.listing_id
    WHERE l.category_id = $1  -- Filter by the provided category ID
    AND l.listing_id != $2    -- Exclude the current listing (to avoid showing the same one)
    GROUP BY
        l.listing_id, 
        l.user_id,  
        l.title, 
        l.description, 
        c.name, 
        l.item_type,  
        l.price,
        l.location,
        u.name,               
        u.profile_image;
  `;

  try {
    // Get the category ID from the provided category name
    const categoryResult = await pool.query(categoryQuery, [category]);
    const categoryID = categoryResult.rows[0].category_id;
    
    // Run the query to get similar listings
    const result = await pool.query(query, [categoryID, listingID]);

    // Loop through each listing and generate signed URLs for file keys and profile image
    const similarListings = await Promise.all(
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

        // Generate pre-signed URL for the profile image
        if (listing.profile) {
          const command = new GetObjectCommand({
            Bucket: profileBucket,
            Key: listing.profile,
          });
          listing.profile = await getSignedUrl(s3, command, { expiresIn: 86400 });
        }

        return {
          ...listing,
          file_keys: signedUrls,
        };
      })
    );

    // Send the response with similar listings
    res.status(200).json(similarListings);
  } catch (err) {
    console.error('Error running query:', err);
    res.status(500).json({ error: 'Database error' });
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



// Add this new endpoint
export const getListingById = async (req, res) => {
  const { listingId } = req.params;

  const query = `
    SELECT
      l.listing_id AS id,
      l.user_id,
      l.title,
      l.description,
      c.name AS category,
      l.item_type AS type,
      l.price,
      l.location,
      ARRAY_AGG(DISTINCT li.file_key) AS file_keys,
      u.name AS author,
      u.profile_image AS profile
    FROM listings l
    JOIN categories c ON l.category_id = c.category_id
    JOIN users u ON l.user_id = u.user_id
    LEFT JOIN listing_images li ON l.listing_id = li.listing_id
    WHERE l.listing_id = $1
    GROUP BY
      l.listing_id,
      l.user_id,
      l.title,
      l.description,
      c.name,
      l.item_type,
      l.price,
      l.location,
      u.name,
      u.profile_image;
  `;

  try {
    const result = await pool.query(query, [listingId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = result.rows[0];
    const signedUrls = await Promise.all(
      (listing.file_keys || []).map(async (fileKey) => {
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
        });
        return getSignedUrl(s3, command, { expiresIn: 86400 });
      })
    );

    if (listing.profile) {
      const command = new GetObjectCommand({
        Bucket: profileBucket,
        Key: listing.profile,
      });
      listing.profile = await getSignedUrl(s3, command, { expiresIn: 86400 });
    }

    const listingWithUrls = {
      ...listing,
      file_keys: signedUrls,
    };

    res.status(200).json(listingWithUrls);
  } catch (err) {
    console.error('Error fetching listing:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

export const getUserServices = async (req, res) => {
  const { listing_id } = req.params;

  const serviceQuery = 'SELECT * FROM listing_services WHERE listing_id = $1';

  try {
    const result = await pool.query(serviceQuery, [listing_id]);
    res.status(200).json(result.rows);
  }
  catch (error) {
    console.error('Failed fetching services', error);
    res.status(500).json({ error: 'Database error' });
  }
};