import { useState } from 'react';
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleprovider } from '../services/firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import React from 'react';
import ForgotPassword from './ForgotPassword';
import './Login.css';
import { toast } from "react-toastify";

const eyeIcons = {
  open: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="#127d8e"
      className="eye-icon"
      style={{ width: 20, height: 20, position: 'absolute', top: 5, right: 0 }}
    >
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
    </svg>
  ),
  closed: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="#127d8e"
      className="eye-icon"
      style={{ width: 20, height: 20, position: 'absolute', top: 5, right: 0 }}
    >
      <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
      <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
      <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
    </svg>
  )
};

// Add global styles for autofill
const globalStyles = `
  input:-internal-autofill-selected { 
    background-color: azure !important; 
    color: black !important; 
  }
`;


const Login = ({ onClose }) => {
  const navigate = useNavigate();
  const { login, showLoginSuccess } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    else if (window.history.length > 2) navigate(-1);
    else navigate('/');
  };

  // Google login
  const loginclick = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleprovider);
      const idToken = await result.user.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.post(`${apiUrl}/api/auth/google-login`, { idToken }, { withCredentials: true });
      await login();
      closeModal();
      showLoginSuccess();
    } catch (err) {
      closeModal();
      toast.error("Login failed", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Email/password registration
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      const { password, name } = form;
      if (!email || !password || !name) {
        toast.error("Please fill all fields.", {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setIsLoading(false);
        return;
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      const idToken = await userCredential.user.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.post(`${apiUrl}/api/auth/google-login`, { idToken, name }, { withCredentials: true });
      await login();
      closeModal();
      showLoginSuccess();
    } catch (err) {
      // **THE FIX IS HERE**
      // Check for the specific "email already in use" error code
      closeModal();
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email address is already registered. Please try logging in instead.', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } else {
        // For any other error, show the default message
        toast.error("Registration failed", {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email/password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      const { password } = form;
      if (!email || !password) {
        toast.error("Please fill all fields.", {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setIsLoading(false);
        return;
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const apiUrl =import.meta.env.VITE_API_URL;
      await axios.post(`${apiUrl}/api/auth/google-login`, { idToken }, { withCredentials: true });
      await login();
      closeModal();
      showLoginSuccess();
    } catch (err) {
      closeModal();
      toast.error("Login failed", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <>
      {isLoading && (
        <div className="login-loading-overlay">
          <div className="loader-circle-50"></div>
        </div>
      )}
      {showForgotPassword ? (
        <ForgotPassword onClose={() => setShowForgotPassword(false)} />
      ) : (
        <div className="login-modal-overlay">
          <div className="login-modal-container">
            <button
              onClick={closeModal}
              className="login-close-btn"
              aria-label="Close"
            >×</button>
            <h1 className="login-title">{isRegister ? "Create Account" : "Log in"}</h1>

            {isRegister ? (
              <p style={{ marginBottom: 16, fontSize: '0.9rem', color: '#666' }}>
                Already have an account ? <span style={{ color: "#127d8e", cursor: "pointer", fontWeight: 500 }} onClick={() => setIsRegister(false)}>Log in</span>
              </p>
            ) : (
              <p style={{ marginBottom: 16, fontSize: '0.9rem', color: '#666' }}>
                New user ? <span style={{ color: "#127d8e", cursor: "pointer", fontWeight: 500 }} onClick={() => setIsRegister(true)}>Register Now</span>
              </p>
            )}

            {!isRegister && (
              <div style={{ marginBottom: 24 }}>
                <button
                  onClick={loginclick}
                  className="login-google-btn"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="login-google-icon" />
                  Continue with Google
                </button>
              </div>
            )}

            <div className="login-divider">
              <hr className="login-divider-hr" />
              <span className="login-divider-span">
                or
              </span>
            </div>

            <form onSubmit={isRegister ? handleEmailRegister : handleEmailLogin}>
              {isRegister && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem', color: '#333', fontWeight: 500 }}>Username</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="name"
                    value={form.name}
                    onChange={handleChange}
                    className="login-input"
                    required
                  />
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem', color: '#333', fontWeight: 500 }}>Username or Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  className="login-input"
                  required
                />
              </div>
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem', color: '#333', fontWeight: 500 }}>Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  className="login-password-input"
                  required
                />
                <button
                  type="button"
                  className={"checkbox-button" + (showPassword ? " open" : "")}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    display: 'inline-flex',
                    position: 'absolute',
                    top: '50%',
                    right: 12,
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    background: 'rgb(111, 16, 16)',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    outline: 'none',
                    alignItems: 'center',
                    zIndex: 2,
                  }}
                >
                  {showPassword ? eyeIcons.closed : eyeIcons.open}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
                {!isRegister && (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgotPassword(true);
                    }}
                    className="login-forgot-link"
                  >
                    Forgot password ?
                  </a>
                )}
              </div>

              <button
                type="submit"
                className="login-submit-btn"
              >
                {isRegister ? "Sign Up" : "Sign In"}
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
};

export default Login;
