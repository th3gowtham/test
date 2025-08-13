import React, { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../styles/FileUploadModal.css';

const FileUploadModal = ({ isOpen, onClose, batchId, privateChatId, onFileUploaded, courseName }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);
  const { userRole,userName}=useAuth()

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB', {
          duration: 4000,
          style: {
            background: "#ef4444",
            color: "#fff",
            fontWeight: 600,
            fontSize: "1rem"
          }
        });
        return;
      }
      setSelectedFile(file);
      toast.success(`File "${file.name}" selected successfully!`, {
        duration: 2000,
        style: {
          background: "#14b8a6",
          color: "#fff",
          fontWeight: 600,
          fontSize: "0.9rem"
        }
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !batchId) {
      toast.error('Please select a file and ensure batch ID is set', {
        duration: 4000,
        style: {
          background: "#ef4444",
          color: "#fff",
          fontWeight: 600,
          fontSize: "1rem"
        }
      });
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');
    
    toast.loading('Uploading file...', {
      duration: 0,
      style: {
        background: "#3b82f6",
        color: "#fff",
        fontWeight: 600,
        fontSize: "0.9rem"
      }
    });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('batchId', batchId);
      formData.append('uploadedBy', userName);
      formData.append('uploadedByRole', userRole);
      formData.append('userName', userName);
      if (description) {
        formData.append('description', description);
      }

      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/files/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setUploadStatus('success');
      
      // Dismiss loading toast and show success toast
      toast.dismiss();
      toast.success(`File "${selectedFile.name}" uploaded successfully!`, {
        duration: 3000,
        style: {
          background: "#14b8a6",
          color: "#fff",
          fontWeight: 600,
          fontSize: "1rem"
        }
      });
      
      // Reset form
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onFileUploaded) {
        onFileUploaded(result);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setUploadStatus(null);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      
      // Dismiss loading toast and show error toast
      toast.dismiss();
      toast.error(`Upload failed: ${error.message}`, {
        duration: 3000,
        style: {
          background: "#ef4444",
          color: "#fff",
          fontWeight: 600,
          fontSize: "1rem"
        }
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setDescription('');
      setUploadStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  // Determine the appropriate title based on context
  const getModalTitle = () => {
    if (privateChatId) {
      return `Upload File to ${courseName || 'Private Chat'}`;
    }
    if (batchId) {
      return 'Upload File to Batch';
    }
    return 'Upload File';
  };

  return (
    <div className="file-upload-modal-overlay">
      <div className="file-upload-modal">
        <div className="file-upload-header">
          <h3>{getModalTitle()}</h3>
          <button className="close-btn" onClick={handleClose} disabled={uploading}>
            <X size={20} />
          </button>
        </div>

        <div className="file-upload-content">
          {/* File Selection */}
          <div className="file-selection">
            <div 
              className="file-drop-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="*/*"
              />
              {selectedFile ? (
                <div className="selected-file">
                  <File size={24} />
                  <span>{selectedFile.name}</span>
                  <span className="file-size">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <Upload size={32} />
                  <p>Click to select a file</p>
                  <p className="upload-hint">or drag and drop</p>
                </div>
              )}
            </div>
          </div>

          {/* Description Input */}
          <div className="description-input">
            <label>Description (optional):</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this file..."
              rows={3}
              disabled={uploading}
            />
          </div>

          {/* Upload Status */}
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus}`}>
              {uploadStatus === 'uploading' && (
                <>
                  <div className="loading-spinner"></div>
                  <span>Uploading file...</span>
                </>
              )}
              {uploadStatus === 'success' && (
                <>
                  <CheckCircle size={20} />
                  <span>File uploaded successfully!</span>
                </>
              )}
              {uploadStatus === 'error' && (
                <>
                  <AlertCircle size={20} />
                  <span>Upload failed. Please try again.</span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="file-upload-actions">
            <button 
              className="cancel-btn" 
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              className="upload-btn" 
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;