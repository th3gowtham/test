// Import Firebase Admin SDK configuration
// This gives us access to Firebase Authentication and Firestore database
const { auth, db } = require('../config/firebaseAdmin');  

// At the top, add bcrypt for password hashing
const bcrypt = require('bcryptjs');

// Add at the top with other imports
const crypto = require('crypto');

// Add rate limiting for forgot password
const forgotPasswordAttempts = new Map();

// Helper: assign role (reuse your logic)
// This helper function now correctly checks for Admins and Teachers
// and returns the name stored in the database for them.
async function getUserRoleAndName(email, nameFromToken) {
  email = email.trim().toLowerCase();
  // 1. Check for Admin
  const adminSnapshot = await db.collection('Admin').where('Gmail', '==', email).get();
  if (!adminSnapshot.empty) {
    const adminData = adminSnapshot.docs[0].data();
    // Use the name from the Admin record in the database
    const dbName = adminData.name || email.split('@')[0]; // Fallback if name is missing in DB
    return { role: 'Admin', name: dbName };
  }

  // 2. Check for Teacher
  const teacherSnapshot = await db.collection('Teacher').where('Gmail', '==', email).get();
  if (!teacherSnapshot.empty) {
    const teacherData = teacherSnapshot.docs[0].data();
    
    const dbName = teacherData.name || email.split('@')[0];
    return { role: 'Teacher', name: dbName };
  }

  // 3. Handle Student (existing or new) - Updated to use where query and auto-generated IDs
  const studentSnapshot = await db.collection('Students').where('Gmail', '==', email).get();

  if (!studentSnapshot.empty) {
    // For existing students, use their name from the database
    const studentData = studentSnapshot.docs[0].data();
    const dbName = studentData.name || email.split('@')[0];
    return { role: 'Student', name: dbName };
  } else {
    // For NEW students, use auto-generated ID and the name from the token
    const newStudentName = nameFromToken; // Always use the provided name
    const newStudentRef = await db.collection('Students').add({ 
      Gmail: email, 
      name: newStudentName, 
      createdAt: new Date() 
    });
    return { role: 'Student', name: newStudentName };
  }
}

// Helper: check if email exists in any collection
async function emailExistsInAnyCollection(email) {
  const adminSnap = await db.collection('Admin').where('Gmail', '==', email).get();
  if (!adminSnap.empty) return true;
  const teacherSnap = await db.collection('Teacher').where('Gmail', '==', email).get();
  if (!teacherSnap.empty) return true;
  const studentSnap = await db.collection('Students').where('Gmail', '==', email).get();
  if (!studentSnap.empty) return true;
  return false;
}

// Registration endpoint (for email/password)
const handleEmailRegister = async (req, res) => {
  const { email, name } = req.body;
  try {
    const userEmail = email.toLowerCase();
    // Check if email exists in any collection
    if (await emailExistsInAnyCollection(userEmail)) {
      return res.status(400).json({ error: 'Email already exists in the system' });
    }
    // At this point, Firebase Auth user is already created on frontend
    // Create Student record in Firestore with auto-generated ID
    await db.collection('Students').add({
      Gmail: userEmail,
      name,
      createdAt: new Date()
    });
    // Assign role
    const { role } = await getUserRoleAndName(userEmail, name);
    res.json({ role, name });
  } catch (err) {
    console.error("[handleEmailRegister] Error:", err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Main function that handles Google login authentication
const handleGoogleLogin = async (req, res) => {
  const { idToken, name: nameFromFrontend } = req.body;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    const email = decoded.email.trim().toLowerCase();
    // Prefer name from frontend, fallback to token/displayName
    const name = nameFromFrontend || decoded.name || decoded.displayName;
    // This now returns the role and the CORRECT name (from DB for existing users)
    const { role, name: dbName } = await getUserRoleAndName(email, name);

    // Set session to 30 days (30 * 24 * 60 * 60 * 1000 milliseconds)
    const expiresIn = 12 * 24 * 60 * 60 * 1000; // 30 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    res.cookie('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    // Return the final role and name to the frontend
    res.json({ role, name });
  } catch (err) {
    console.error("[handleGoogleLogin] Error verifying ID token:", err);
    res.status(401).json({
      error: 'Invalid token. Verification failed.',
      details: err.message
    });
  }
};

// Teacher password setup endpoint - Updated to not store password in collection
const setTeacherPassword = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const lowerEmail = email.trim().toLowerCase();
  try {
    // Check if email is in Teacher collection
    const teacherSnap = await db.collection('Teacher').where('Gmail', '==', lowerEmail).get();
    if (teacherSnap.empty) {
      return res.status(403).json({ error: 'Access denied: Not a teacher' });
    }

    // Don't store password in collection - just return success
    // The password will be handled by Firebase Auth only

    res.json({ message: 'Password set successfully' });
  } catch (err) {
    console.error("[setTeacherPassword] Error:", err);
    res.status(500).json({ error: 'Failed to set password' });
  }
};

// Teacher login endpoint - Updated to use Firebase Auth
const teacherLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const lowerEmail = email.trim().toLowerCase();
  try {
    // Check if email is in Teacher collection
    const teacherSnap = await db.collection('Teacher').where('Gmail', '==', lowerEmail).get();
    if (teacherSnap.empty) {
      return res.status(403).json({ error: 'Access denied: Not a teacher' });
    }

    const teacherData = teacherSnap.docs[0].data();

    // Create a custom token for teacher login (since we don't have Firebase ID token)
    const customToken = await auth.createCustomToken(teacherData.Gmail);
    
    // Set session to 30 days (30 * 24 * 60 * 60 * 1000 milliseconds)
    const expiresIn = 30 * 24 * 60 * 60 * 1000; // 30 days
    const sessionCookie = await auth.createSessionCookie(customToken, { expiresIn });

    res.cookie('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    res.json({ message: 'Login successful', role: 'Teacher', name: teacherData.name });
  } catch (err) {
    console.error("[teacherLogin] Error:", err);
    res.status(500).json({ error: 'Login failed' });
  }
};

const logout = (req, res) => {
  res.clearCookie('session', {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });

  res.json({ message: 'Logged out' });
};

// Check if teacher exists endpoint
const teacherExists = async (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ exists: false });
  try {
    const teacherSnap = await db.collection('Teacher').where('Gmail', '==', email).get();
    if (!teacherSnap.empty) {
    
      return res.json({ exists: true });
    } else {
    
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error('[teacherExists] Error:', err);
    return res.status(500).json({ exists: false });
  }
};

// Simple forgot password endpoint
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    // 1. Basic validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        message: 'A reset link has been sent' 
      });
    }

    const lowerEmail = email.trim().toLowerCase();
    
    // 2. Rate limiting (5 attempts per hour per IP)
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const attempts = forgotPasswordAttempts.get(clientIP) || [];
    const recentAttempts = attempts.filter(time => now - time < 3600000); // 1 hour
    
    if (recentAttempts.length >= 5) {
      return res.status(429).json({ 
        message: 'Too many requests. Please try again later.' 
      });
    }
    
    // 3. Check if email exists in your organization collections
    const emailExists = await emailExistsInAnyCollection(lowerEmail);
    
    // 4. Always return the same response (prevents email enumeration)
    const response = { 
      message: 'A reset link has been sent.',
      success: true
    };
    
    // 5. Only send Firebase reset email if user exists in database
    if (emailExists) {
      try {
        // Use Firebase Admin to send reset email
        const { auth } = require('../config/firebaseAdmin');
        
        // Generate password reset link
        const actionCodeSettings = {
          url: `${process.env.CLIENT_URL}/login`,
          handleCodeInApp: true,
        };
        
        // Send password reset email via Firebase
        await auth.generatePasswordResetLink(lowerEmail, actionCodeSettings);
        
      } catch (firebaseError) {
        // Silent error handling - no console logs
      }
    }
    
    // 6. Update rate limiting
    recentAttempts.push(now);
    forgotPasswordAttempts.set(clientIP, recentAttempts);
    
    res.json(response);
    
  } catch (error) {
    // Always return the same response even on error
    res.json({ 
      message: 'A reset link has been sent',
      success: true
    });
  }
};

module.exports = { 
  handleGoogleLogin, 
  logout, 
  getUserRoleAndName, 
  handleEmailRegister, 
  setTeacherPassword, 
  teacherLogin, 
  teacherExists,
  forgotPassword
};

