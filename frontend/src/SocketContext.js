// SocketContext.js
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// 1) Create a Context
const SocketContext = createContext(null);

// 2) Create a Provider that wraps your app
export const SocketProvider = ({ children }) => {
  // Use a ref so the socket doesn’t re-init on every render
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket once, on mount
    socketRef.current = io(process.env.REACT_APP_BACKEND_URL, {
      // Any needed options, e.g. transports, auth, etc.
    });

    // Cleanup on unmount
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

// 3) A small hook to read the socket
export const useSocket = () => {
  return useContext(SocketContext);
};
