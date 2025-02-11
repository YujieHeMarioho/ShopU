//import expressJwt from 'express-jwt';
//import jwksRsa from 'jwks-rsa';
//import { jwtDecode } from "jwt-decode";

// Auth0 setup
//const domain = process.env.REACT_APP_AUTH0_DOMAIN;
//const apiURL = process.env.API_AUDIENCE; 

// List of paths that don't require authentication
const openPaths = [
  '/api/filters'
];
  
  // Log user data to check if it's being populated
  const authMiddleware = (req, res, next) => {
    if (openPaths.includes(req.path)) {
      return next();
    }

    // Can be used to debug the access token 
    //console.log("Authorization Header:", req.headers.authorization); // Log to check token in header
    // console.log("authMiddleware token is:", token); // Log to check token in header
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
    }

    checkJwt(req, res, (err) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      next();
    });
  };
  
  export default authMiddleware;
  