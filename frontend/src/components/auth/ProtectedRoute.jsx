import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const ProtectedRoute = ({ requireSuperAdmin = false }) => {
  const token = localStorage.getItem('access_token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const decoded = jwtDecode(token);
    
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.clear();
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // You can add your requireSuperAdmin logic here later

    return <Outlet />;
    
  } catch (error) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};