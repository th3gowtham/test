import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PaymentProvider } from "./context/PaymentContext";
// Import global styles
import './index.css';
// import './styles/main.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <PaymentProvider>
        <App />
      </PaymentProvider>
    </AuthProvider>
  </React.StrictMode>
);
