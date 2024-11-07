// frontend/src/Components/Common/PrivateRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth0();

    if (isLoading) {
        return <div>Loading...</div>; // You can replace this with a spinner or loader component
    }

    return isAuthenticated ? children : <Navigate to="/home" />; // Redirect to home or login
};

export default PrivateRoute;
