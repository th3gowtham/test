import React from 'react';
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { FiLoader } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { userRole, loading } = useContext(AuthContext);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin text-blue-600 mb-4">
          <FiLoader size={40} />
        </div>
        <p className="text-gray-600 text-lg font-medium">Verifying access...</p>
      </div>
    );
  }

  // Redirect to unauthorized page if user is not an admin
  if (userRole !== 'Admin') {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Render the protected content if user is an admin
  return children;
};

export default ProtectedAdminRoute;