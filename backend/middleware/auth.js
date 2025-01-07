import expressJwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
//import { jwtDecode } from "jwt-decode";

// Auth0 setup
const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const apiURL = process.env.API_AUDIENCE; 

const checkJwt = expressJwt({
    secret: jwksRsa.expressJwtSecret({
      jwksUri: `https://${domain}/.well-known/jwks.json`, 
    }),
    audience: apiURL,
    issuer: `https://${domain}/`,
    algorithms: ['RS256'],
  }).unless({
    path: []  // For any unprotected routes
  });
  
  // Log user data to check if it's being populated
  const authMiddleware = (req, res, next) => {

    // Can be used to debug the access token 

    //console.log("Authorization Header:", req.headers.authorization); // Log to check token in header
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    // console.log("authMiddleware token is:", token); // Log to check token in header

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
    }

    // try {
    //     const decoded = jwtDecode(token); // Decode the token
    //     console.log('Decoded token:', decoded);
    // } catch (err) {
    //     console.error('Error decoding token:', err);
    //     return res.status(401).json({ message: 'Invalid token' });
    // }

    checkJwt(req, res, () => {
      next();
    });
  };
  
  export default authMiddleware;
  