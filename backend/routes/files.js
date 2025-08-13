const express = require('express');
const router = express.Router();
const { 
  uploadFile, 
  getAllFiles,
  getFilesByBatch, 
  getFileById,
  downloadFile,
  updateFile,
  deleteFile,
  getAvailableBatches,
  upload 
} = require('../controllers/fileController');
const verifySessionCookie = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// CREATE - Upload file (temporarily allowing all authenticated users)
router.post('/upload', 
  verifySessionCookie, 
  // requireRole(['admin', 'teacher']), // Temporarily commented out for testing
  upload.single('file'), 
  uploadFile
);

// READ - Get all files (with optional filtering)
router.get('/files', 
  verifySessionCookie, 
  getAllFiles
);

// READ - Get files by batch ID
router.get('/files/batch/:batchId', 
  verifySessionCookie, 
  getFilesByBatch
);

// READ - Get single file by ID
router.get('/files/:fileId', 
  verifySessionCookie, 
  getFileById
);

// READ - Download file
router.get('/download/:fileId', 
  verifySessionCookie, 
  downloadFile
);

// UPDATE - Update file metadata (admin and teacher only)
router.put('/files/:fileId', 
  verifySessionCookie, 
  requireRole(['admin', 'teacher']), 
  updateFile
);

// DELETE - Delete file (admin and teacher only)
router.delete('/files/:fileId', 
  verifySessionCookie, 
  requireRole(['admin', 'teacher']), 
  deleteFile
);

// Get available batches
router.get('/batches', 
  verifySessionCookie, 
  getAvailableBatches
);

module.exports = router;