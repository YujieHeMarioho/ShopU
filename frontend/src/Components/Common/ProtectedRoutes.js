import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ requiredPermissions = [], children }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [hasPermission, setHasPermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const token = await getAccessTokenSilently();
        const decodedToken = jwtDecode(token);
        const userPermissions = decodedToken.permissions || [];
        const hasAnyPermission = requiredPermissions.some(permission => 
          userPermissions.includes(permission)
        );
        setHasPermission(hasAnyPermission);
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
      setCheckingPermission(false);
    };

    checkPermissions();
  }, [getAccessTokenSilently, requiredPermissions]);

  if (checkingPermission) {
    return <div>Checking permissions...</div>;
  }

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;