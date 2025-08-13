import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiLock, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';

const Unauthorized = () => {
  const [fadeIn, setFadeIn] = useState(false);
  
  useEffect(() => {
    // Trigger fade-in animation after component mounts
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-4">
      <div className={`max-w-md w-full text-center p-12 bg-white rounded-2xl shadow-2xl border border-gray-100 transform transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="w-24 h-24 mx-auto mb-8 flex items-center justify-center bg-gradient-to-r from-red-50 to-red-100 rounded-full shadow-inner relative overflow-hidden group">
          <FiLock className="text-red-600 text-5xl transform transition-all duration-300 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="relative mb-4">
          <h1 className="text-5xl font-extrabold text-red-600 inline-flex items-center">
            <span className="mr-2">Access Denied</span>
            <FiAlertTriangle className="text-3xl text-amber-500 animate-pulse" />
          </h1>
        </div>
        
        <div className="w-24 h-1 mx-auto bg-gradient-to-r from-red-300 to-red-100 rounded-full mb-8"></div>
        
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-10 rounded-r-lg">
          <p className="text-gray-700 text-lg leading-relaxed">
            Sorry, you don't have permission to access this page. This area is restricted to administrators only.
          </p>
        </div>
        
        <Link
          to="/"
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-lg font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
        >
          <FiArrowLeft className="mr-3" />
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;