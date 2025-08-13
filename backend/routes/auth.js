// Import Express framework to create our routes
// Routes are like "addresses" that tell the server where to send different types of requests
const express = require('express');

// Import our authentication controller functions
// Controllers contain the actual logic for handling requests (like login processing)
const { handleGoogleLogin, logout, getUserRoleAndName, handleEmailRegister, setTeacherPassword, teacherLogin, teacherExists, forgotPassword } = require('../controllers/authController');

// Import middleware for session verification
const verifySessionCookie = require('../middleware/authMiddleware');

// Import Firebase Admin for user role and name lookup
const { db } = require('../config/firebaseAdmin');

// Create a router instance
// A router is like a traffic director - it takes incoming requests and sends them to the right handler
const router = express.Router();

// Define our authentication routes
// This creates a POST endpoint at '/google-login'
// When someone sends a POST request to '/api/auth/google-login', it will call the handleGoogleLogin function
router.post('/google-login', handleGoogleLogin);

// Add a POST endpoint for logout
router.post('/logout', logout);

// User info endpoint
router.get('/me', verifySessionCookie, async (req, res) => {
  const email = req.user.email.toLowerCase();
  const nameFromToken = req.user.name;

  // **THE FIX IS HERE:** Capture both `role` and `name` from your helper.
  const { role, name } = await getUserRoleAndName(email, nameFromToken);

  // Now, send the correct `name` from the database in the response.
  res.json({ user: req.user, role, name });
});

// Registration endpoint (for email/password)
router.post('/register', handleEmailRegister);

// Teacher exists endpoint
router.get('/teachers/exists', teacherExists);

// Teacher password setup endpoint
router.post('/teachers/set-password', setTeacherPassword);
router.post('/teachers/login', teacherLogin);

// Forgot password endpoint
router.post('/forgot-password', forgotPassword);

// Export the router so it can be used in our main server file
// This connects our routes to the main Express application
module.exports = router;
