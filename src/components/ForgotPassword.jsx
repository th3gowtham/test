import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import axios from 'axios';

// Add global styles for autofill
const globalStyles = `
  input:-internal-autofill-selected { 
    background-color: azure !important; 
    color: black !important; 
  }
`;

const ForgotPassword = ({ onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Apply global styles
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = globalStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const closeModal = () => {
    if (onClose) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: 'Please enter your email address', type: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });
    
    try {
      // First check if email exists in your database
      const apiUrl = import.meta.env.VITE_API_URL;
      const checkResponse = await axios.post(`${apiUrl}/api/auth/forgot-password`, { email });
      
      // If backend says it's valid, send Firebase reset email
      if (checkResponse.data.success) {
        try {
          await sendPasswordResetEmail(auth, email);
          console.log('Firebase reset email sent successfully');
        } catch (firebaseError) {
          console.error('Firebase reset email error:', firebaseError);
          // Don't expose Firebase errors to user
        }
      }
      
      // Always show the same success message
      setMessage({ 
        text: 'A reset link has been sent', 
        type: 'success' 
      });
      setEmail('');
      
    } catch (err) {
      // Always show the same message even on error to prevent enumeration
      setMessage({ 
        text: 'A reset link has been sent', 
        type: 'success' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgb(122 119 119 / 45%)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', color: '#333', borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: '2rem',
        minWidth: 340, maxWidth: 400, position: 'relative', textAlign: 'left'
      }}>
        <button
          onClick={closeModal}
          style={{
            position: 'absolute', top: 16, right: 16, background: 'none',
            border: 'none', fontSize: 22, color: '#666', cursor: 'pointer', fontWeight: 'bold'
          }}
          aria-label="Close"
        >×</button>
        
        <h1 style={{
          color: '#333', fontWeight: 600, marginBottom: 16, fontSize: '1.5rem', textAlign: 'left'
        }}>Reset Password</h1>
        
        <p style={{ marginBottom: 16, fontSize: '0.9rem', color: '#666' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {message.text && (
          <div style={{
            padding: '10px',
            marginBottom: '16px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#e6f7ee' : '#ffebee',
            color: message.type === 'success' ? '#2e7d32' : '#c62828',
            fontSize: '0.9rem'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem', color: '#333', fontWeight: 500 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              style={{ width: "100%", padding: 10, borderRadius: 4, border: '1px solid #ddd', fontSize: '0.9rem' }}
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: '#127d8e', 
              color: 'white', 
              fontWeight: 500, 
              border: 'none', 
              borderRadius: '4px',
              padding: '12px', 
              fontSize: '1rem', 
              width: "100%", 
              cursor: isSubmitting ? 'not-allowed' : 'pointer', 
              transition: 'background 0.2s',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Sending...' : 'Reset Password'}
          </button>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                closeModal();
              }}
              style={{ color: '#127d8e', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              Back to Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;