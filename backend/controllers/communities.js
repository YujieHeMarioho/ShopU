import { s3, pool, buckets } from '../pool.js';
import { jwtDecode } from "jwt-decode";
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const bucketName = buckets.community;

//get details of a community by id
export const getCommunityDetails = async (req, res) => {
    const community_id = req.body.community_id;

    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;  
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    const query = `
    SELECT comms.community_id, comms.name, comms.description, comm_img.file_key
    FROM public.communities AS comms
    LEFT JOIN public.community_images AS comm_img ON comms.community_id = comm_img.community_id
    WHERE comms.community_id = $1;`;

    try {
        const result = await pool.query(query, [community_id]);
        console.error(result);
        // Loop through each community and generate signed URLs for the image file_key
        const communityWithUrl = await Promise.all(
            result.rows.map(async (community) => {
            // Generate a pre-signed URL for the community's image file_key (if it exists)
            let imageUrl = null;
            if (community.file_key) {
                const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: community.file_key, // The file_key from the community_images table
                });
        
                // Generate the signed URL
                imageUrl = await getSignedUrl(s3, command, { expiresIn: 86400 }); // URL expires in 1 day
            }
        
            // Return the community with the signed URL for the image (if it exists)
            return {
                community_id: community.community_id,
                name: community.name,
                description: community.description,
                imageUrl: imageUrl, // Add image URL to the community data
            };
            })
        );
        
        // Return the response with the communities and their image URLs
        res.status(200).json(communitiesWithUrls);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

//get communities for user
export const getUserCommunities = async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;  
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    const query = `
    SELECT comms.community_id, comms.name, comms.description, comm_img.file_key
    FROM public.communities AS comms
    JOIN public.community_members AS mems ON comms.community_id = mems.community_id
    LEFT JOIN public.community_images AS comm_img ON comms.community_id = comm_img.community_id
    WHERE mems.user_id = $1;`;

    try {
        const result = await pool.query(query, [user_id]);
        // Loop through each community and generate signed URLs for the image file_key
        const communitiesWithUrls = await Promise.all(
            result.rows.map(async (community) => {
            // Generate a pre-signed URL for the community's image file_key (if it exists)
            let imageUrl = null;
            if (community.file_key) {
                const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: community.file_key, // The file_key from the community_images table
                });
        
                // Generate the signed URL
                imageUrl = await getSignedUrl(s3, command, { expiresIn: 86400 }); // URL expires in 1 day
            }
        
            // Return the community with the signed URL for the image (if it exists)
            return {
                user_id: community.user_id,
                community_id: community.community_id,
                name: community.name,
                description: community.description,
                joined_at: community.joined_at,
                imageUrl: imageUrl, // Add image URL to the community data
            };
            })
        );
        
        // Return the response with the communities and their image URLs
        res.status(200).json(communitiesWithUrls);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

//get all communities
export const getAllCommunities = async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    const query = `
        SELECT DISTINCT comms.community_id, comms.name, comms.description, comm_img.file_key 
        FROM public.communities AS comms
        LEFT OUTER JOIN public.community_members AS mems 
        ON comms.community_id = mems.community_id
        LEFT OUTER JOIN public.community_images AS comm_img
        ON comms.community_id = comm_img.community_id
        WHERE mems.user_id != $1 OR mems.user_id IS NULL;`;

    try {
        const result = await pool.query(query, [user_id]); //user_id

        // Loop through each community and generate signed URLs for the image file_key
        const communitiesWithUrls = await Promise.all(
            result.rows.map(async (community) => {
            // Generate a pre-signed URL for the community's image file_key (if it exists)
            let imageUrl = null;
            if (community.file_key) {
                const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: community.file_key, // The file_key from the community_images table
                });
        
                // Generate the signed URL
                imageUrl = await getSignedUrl(s3, command, { expiresIn: 86400 }); // URL expires in 1 day
            }

            return {
                community_id: community.community_id,
                name: community.name,
                description: community.description,
                imageUrl: imageUrl, 
            };
            })
        );
        
        // Return the response with the communities and their image URLs
        res.status(200).json(communitiesWithUrls);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

//get created communities for user
export const getCreatedCommunities = async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    const query = `
    SELECT comms.community_id, comms.name, comms.description, comm_img.file_key
    FROM public.communities AS comms
    LEFT JOIN public.community_images AS comm_img ON comms.community_id = comm_img.community_id
    WHERE comms.created_by = $1;`;
    
    try {
        const result = await pool.query(query, [user_id]);
        // Loop through each community and generate signed URLs for the image file_key
        const communitiesWithUrls = await Promise.all(
            result.rows.map(async (community) => {
            // Generate a pre-signed URL for the community's image file_key (if it exists)
            let imageUrl = null;
            if (community.file_key) {
                const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: community.file_key, // The file_key from the community_images table
                });
        
                // Generate the signed URL
                imageUrl = await getSignedUrl(s3, command, { expiresIn: 86400 }); // URL expires in 1 day
            }

            return {
                community_id: community.community_id,
                name: community.name,
                description: community.description,
                created_at: community.created_at,
                imageUrl: imageUrl, // Add image URL to the community data
            };
            })
        );
        
        // Return the response with the communities and their image URLs
        res.status(200).json(communitiesWithUrls);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

//get users in community
export const getCommunityMembers = async (req, res) => {
    const community_id = req.body.community_id;
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;
    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    const query = `
    SELECT comms.user_id
    FROM public.community_members AS comms
    WHERE comms.community_id = $1;`;
    
    try {
        const result = await pool.query(query, [community_id]);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error running query:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

//endpoint to upload an image to the bucket
export const uploadCommunityImage = async (req, res) => {
  try {
    if (!req.file){
        return res.status(400).json({ message: "No files uploaded" });
    }

    // Preproccess the images
    const buffer = await sharp(req.file.buffer).resize({ height: 1080, width: 1920, fit: "cover" }).toBuffer();

    //Create unique image names so no collusion within the bucket
    const fileName = `${uuidv4()}-${req.file.originalname}`;

    //upload params 
    const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: req.file.mimetype,
    };

    // Upload to S3
    await s3.send(new PutObjectCommand(params));

    res.status(200).json({
      message: "Files uploaded successfully",
      fileKey: fileName,
    });
  } catch (err) {
    console.error("Error uploading images:", err);
    res.status(500).json({ message: "Error uploading files", error: err });
  }
};

//endpoint to add a community
export const addCommunity = async (req, res) => {
    const name = req.body.name;
    const description = req.body.description;
    const image = req.body.imageKey;
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;
    let comm_id;

    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if all required fields are provided
    if (!user_id || !name || !description) {
        return res.status(400).json({ error: 'Missing required fields', fields: { user_id, community_id}});
    }
    // Generate the joined_at timestamp
    const joined_at = new Date().toISOString(); // Current timestamp in ISO format
    comm_id = -1
    try {
        // Insert new community into the database
        const result = await pool.query(
            'INSERT INTO communities (created_by, name, description, created_at, member_count) VALUES ($1, $2, $3, $4, $5) RETURNING community_id;',
            [user_id, name, description, joined_at, 1]
        );
        comm_id = result.rows[0].community_id;
        //res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    try{
        await pool.query(
            'INSERT INTO community_images (community_id, file_key) VALUES ($1, $2);',
            [comm_id, image]
        );
    }
    catch(error){
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (comm_id == -1)
        return res.status(500).json({ error: 'Internal Server Error' });

    try {
        // Insert new association into the database
        const result = await pool.query(
            'INSERT INTO community_members (community_id, user_id, joined_at) VALUES ($1, $2, $3)',
            [comm_id, user_id, joined_at]
        );
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Endpoint to join a community
export const joinCommunity = async (req, res) => {
    const community_id = req.body.community_id;

    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;

    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if all required fields are provided
    if (!user_id || !community_id) {
        return res.status(400).json({ error: 'Missing required fields nar', fields: { user_id, community_id}});
    }

    // Generate the joined_at timestamp
    const joined_at = new Date().toISOString(); // Current timestamp in ISO format

    try {
        // Insert new association into the database
        const result = await pool.query(
            'INSERT INTO community_members (community_id, user_id, joined_at) VALUES ($1, $2, $3)',
            [community_id, user_id, joined_at]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Endpoint to leave a community
export const leaveCommunity = async (req, res) => {
    const { community_id } = req.params;  

    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    let user_id;

    try {
        const decodedToken = jwtDecode(token); // Decode the token
        user_id = decodedToken.sub;
    } catch (err) {
        console.error('Error decoding token:', err);
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if all required fields are provided
    if (!user_id || !community_id) {
        return res.status(400).json({ error: 'Missing required fields', fields: { user_id, listing_id} });
    }
    try {
        // query leave community
        const result = await pool.query(
            'DELETE FROM community_members WHERE user_id = $1 AND community_id = $2 RETURNING *',
            [user_id, community_id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Community not found' });
        }

        res.status(200).json({ message: 'Community left successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default {getAllCommunities, joinCommunity, leaveCommunity, uploadCommunityImage };