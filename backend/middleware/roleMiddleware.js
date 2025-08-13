const { db } = require('../config/firebaseAdmin');

// Middleware to check if user has required role
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const email = req.user.email.toLowerCase();
      
      // Check for Admin
      const adminSnapshot = await db.collection('Admin').where('Gmail', '==', email).get();
      if (!adminSnapshot.empty) {
        const userRole = 'admin';
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ 
            error: 'Insufficient permissions',
            required: allowedRoles,
            current: userRole
          });
        }
        req.userRole = userRole;
        return next();
      }

      // Check for Teacher
      const teacherSnapshot = await db.collection('Teacher').where('Gmail', '==', email).get();
      if (!teacherSnapshot.empty) {
        const userRole = 'teacher';
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ 
            error: 'Insufficient permissions',
            required: allowedRoles,
            current: userRole
          });
        }
        req.userRole = userRole;
        return next();
      }

      // Check for Student
      const studentSnapshot = await db.collection('Students').where('Gmail', '==', email).get();
      if (!studentSnapshot.empty) {
        const userRole = 'student';
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ 
            error: 'Insufficient permissions',
            required: allowedRoles,
            current: userRole
          });
        }
        req.userRole = userRole;
        return next();
      }
      
      // User not found in any collection
      return res.status(403).json({ error: 'User not found' });
      
    } catch (error) {
      console.error('Role verification error:', error);
      res.status(500).json({ error: 'Role verification failed' });
    }
  };
};

// Middleware to check if user is in the specified batch
const requireBatchAccess = () => {
  return async (req, res, next) => {
    try {
      const { batchSession } = req.params;
      const email = req.user.email.toLowerCase();
      
      // Check for Admin
      const adminSnapshot = await db.collection('Admin').where('Gmail', '==', email).get();
      if (!adminSnapshot.empty) {
        return next(); // Admin can access all batches
      }

      // Check for Teacher
      const teacherSnapshot = await db.collection('Teacher').where('Gmail', '==', email).get();
      if (!teacherSnapshot.empty) {
        return next(); // Teacher can access all batches
      }
      
      // Check for Student
      const studentSnapshot = await db.collection('Students').where('Gmail', '==', email).get();
      if (!studentSnapshot.empty) {
        const userData = studentSnapshot.docs[0].data();
        const userBatches = userData.batches || [];
        
        // Students can only access their assigned batches
        if (!userBatches.includes(batchSession)) {
          return res.status(403).json({ 
            error: 'Access denied to this batch',
            batch: batchSession,
            userBatches: userBatches
          });
        }
        return next();
      }
      
      // User not found in any collection
      return res.status(403).json({ error: 'User not found' });
      
    } catch (error) {
      console.error('Batch access verification error:', error);
      res.status(500).json({ error: 'Batch access verification failed' });
    }
  };
};

module.exports = { requireRole, requireBatchAccess };