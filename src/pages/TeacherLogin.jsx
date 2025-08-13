import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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

const TeacherLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [success, setSuccess] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const { login, showLoginSuccess } = useAuth();
  const navigate = useNavigate();

  // On mount, check if email exists in Teacher collection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setChecking(true);
      axios.get(`${apiUrl}/api/auth/teachers/exists?email=${encodeURIComponent(emailParam)}`)
        .then(res => {
          if (res.data.exists) {
            setAccessAllowed(true);
          } else {
            setAccessAllowed(false);
            setMessage('Access denied: Only teachers can access this page.');
          }
        })
        .catch(() => {
          setAccessAllowed(false);
          setMessage('Access denied: Only teachers can access this page.');
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
      setAccessAllowed(false);
    }
  }, [apiUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const lowerEmail = email.trim().toLowerCase();

      // Step 1: Set password in Teacher collection
      await axios.post(`${apiUrl}/api/auth/teachers/set-password`, {
        email: lowerEmail,
        password: password
      }, { withCredentials: true });

      setMessage('Password set successfully! Creating account...');

      // Step 2: Create Firebase Auth user (like registration)
      try {
        await createUserWithEmailAndPassword(auth, lowerEmail, password);
        setMessage('Account created! Logging you in...');
      } catch (firebaseErr) {
        // If user already exists in Firebase Auth, that's fine - continue with login
        if (firebaseErr.code !== 'auth/email-already-in-use') {
          throw firebaseErr;
        }
        setMessage('Account exists! Logging you in...');
      }

      // Step 3: Sign in with Firebase Auth to get ID token
      await signInWithEmailAndPassword(auth, lowerEmail, password);
      const idToken = await auth.currentUser.getIdToken();

      // Step 4: Create session using the ID token (like regular login)
      await axios.post(`${apiUrl}/api/auth/google-login`, { idToken }, { withCredentials: true });

      // Step 5: Update global auth state
      await login();

      setSuccess(true);
      setMessage('Welcome! Redirecting to your dashboard...');
      showLoginSuccess();
      setTimeout(() => {
        navigate('/chat');
      }, 1000);
    } catch (err) {
      let errorMessage = '';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please try logging in with the main login form.';
      } else {
        errorMessage = err.message || 'An error occurred';
      }
      setMessage(errorMessage);
      toast.error(errorMessage, {
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
    setLoading(false);
  };

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f7fbfc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Arial, sans-serif',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(18, 125, 142, 0.12)',
          padding: '2.5rem 2rem 2rem 2rem',
          minWidth: 340,
          maxWidth: 400,
          width: '100%',
          position: 'relative',
          textAlign: 'center',
          border: '1.5px solid #e3e8ee',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e3e8ee',
              borderTop: '3px solid #127d8e',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{
              color: '#127d8e',
              fontWeight: 600,
              fontSize: '1.1rem',
              letterSpacing: 0.2
            }}>
              Checking access...
            </div>
            <div style={{
              color: '#666',
              fontSize: '0.9rem',
              fontWeight: 400
            }}>
              Verifying your teacher credentials
            </div>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!email) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f7fbfc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Arial, sans-serif',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(18, 125, 142, 0.12)',
          padding: '2.5rem 2rem 2rem 2rem',
          minWidth: 340,
          maxWidth: 400,
          width: '100%',
          position: 'relative',
          textAlign: 'center',
          border: '1.5px solid #e3e8ee',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#fff6f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #d32f2f'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#d32f2f">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div style={{
              color: '#d32f2f',
              fontWeight: 600,
              fontSize: '1.1rem',
              letterSpacing: 0.2
            }}>
              No Email Provided
            </div>
            <div style={{
              color: '#666',
              fontSize: '0.9rem',
              fontWeight: 400
            }}>
              Please use the correct link to access this page
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!accessAllowed) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f7fbfc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Arial, sans-serif',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(18, 125, 142, 0.12)',
          padding: '2.5rem 2rem 2rem 2rem',
          minWidth: 340,
          maxWidth: 400,
          width: '100%',
          position: 'relative',
          textAlign: 'center',
          border: '1.5px solid #e3e8ee',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#fff6f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #d32f2f'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#d32f2f">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div style={{
              color: '#d32f2f',
              fontWeight: 600,
              fontSize: '1.1rem',
              letterSpacing: 0.2
            }}>
              Access Denied
            </div>
            <div style={{
              color: '#666',
              fontSize: '0.9rem',
              fontWeight: 400
            }}>
              {message || 'Only teachers can access this page.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f7fbfc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, Arial, sans-serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(18, 125, 142, 0.12)',
        padding: '2.5rem 2rem 2rem 2rem',
        minWidth: 340,
        maxWidth: 400,
        width: '100%',
        position: 'relative',
        textAlign: 'left',
        border: '1.5px solid #e3e8ee',
        transition: 'box-shadow 0.2s',
      }}>
        <h2 style={{
          color: '#333333',
          fontWeight: 700,
          marginBottom: 18,
          fontSize: '1.7rem',
          letterSpacing: 0.5,
          textAlign: 'left',
        }}>Set Your Password</h2>
        <p style={{ marginBottom: 18, fontSize: '1rem', color: '#666', fontWeight: 400 }}>
          Please set your desired password for your teacher account. You will use this password to log in next time.
        </p>
        {success ? (
          <div style={{
            marginTop: 20,
            color: '#127d8e',
            background: '#eaf6fa',
            border: '1.5px solid #127d8e33',
            borderRadius: 6,
            padding: '12px 10px',
            fontWeight: 500,
            fontSize: '1rem',
            textAlign: 'center',
            letterSpacing: 0.1,
          }}>
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off">
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 7, fontSize: '1rem', color: '#127d8e', fontWeight: 600 }}>Email</label>
              <input
                type="email"
                value={email}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px 10px',
                  borderRadius: 6,
                  border: '1.5px solid #e3e8ee',
                  background: '#f4fafd',
                  color: '#333',
                  fontSize: '1rem',
                  fontWeight: 500,
                  outline: 'none',
                  marginBottom: 2,
                  cursor: 'not-allowed',
                  letterSpacing: 0.2,
                }}
              />
            </div>
            <div style={{ marginBottom: 18, position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: 7, fontSize: '1rem', color: '#127d8e', fontWeight: 600 }}>
                Create Password
              </label>
              <input
                id="password-field"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Create a strong password"
                style={{
                  width: '100%',
                  padding: '12px 38px 12px 10px',
                  borderRadius: 6,
                  border: '1.5px solid #e3e8ee',
                  background: '#f8fcfd',
                  color: '#333',
                  fontSize: '1rem',
                  fontWeight: 500,
                  outline: 'none',
                  marginBottom: 2,
                  letterSpacing: 0.2,
                  transition: 'border 0.2s',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                className={"toggle-button" + (showPassword ? " open" : "")}
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
                  background: 'none',
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
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#127d8e99' : '#127d8e',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                borderRadius: 6,
                padding: '13px',
                fontSize: '1.08rem',
                width: '100%',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(18, 125, 142, 0.08)',
                marginTop: 6,
                letterSpacing: 0.2,
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Please wait...' : 'Set Password & Register'}
            </button>
            {message && (
              <div
                style={{
                  marginTop: 20,
                  color: message.startsWith('Welcome') || message.startsWith('Password set successfully') || message.startsWith('Account created') || message.startsWith('Account exists') ? '#127d8e' : '#d32f2f',
                  background: message.startsWith('Welcome') || message.startsWith('Password set successfully') || message.startsWith('Account created') || message.startsWith('Account exists') ? '#eaf6fa' : '#fff6f6',
                  border: message.startsWith('Welcome') || message.startsWith('Password set successfully') || message.startsWith('Account created') || message.startsWith('Account exists') ? '1.5px solid #127d8e33' : '1.5px solid #d32f2f33',
                  borderRadius: 6,
                  padding: '12px 10px',
                  fontWeight: 500,
                  fontSize: '1rem',
                  textAlign: 'center',
                  letterSpacing: 0.1,
                }}
              >
                {message}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default TeacherLogin;
