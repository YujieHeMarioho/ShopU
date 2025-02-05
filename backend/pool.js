// pool.js
import pkg from 'pg';
import dotenv from 'dotenv';
import { S3Client } from '@aws-sdk/client-s3';
dotenv.config();

const { Pool } = pkg;


const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.BUCKET_ACCESS_KEY
const secretAccessKey = process.env.BUCKET_SECRET_KEY

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD, 
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false // Adjust based on your SSL requirements
    }
});

const s3 = new S3Client({
    region: bucketRegion,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretAccessKey
    }
  });

export { pool, s3 };
