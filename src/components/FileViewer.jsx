import React, { useState, useEffect, useRef } from 'react';
import { Download, File, FileText, Image, Video, Archive, FileX, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../styles/FileViewer.css';
import '../styles/ToastConfirm.css';

const FileViewer = ({ batchId, privateChatId, onFileDeleted, onFileCountUpdate }) => {
  const { userRole} = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const toastShownRef = useRef({});

  const apiUrl = import.meta.env.VITE_API_URL;

  const currentScope = privateChatId ? 'chat' : 'batch';
  const currentId = privateChatId || batchId;

  useEffect(() => {
    if (currentId) {
      fetchFiles();
    }
    // Reset toast flag for this id
    toastShownRef.current[currentId] = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const fetchFiles = async () => {
    if (!currentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Try multiple endpoints for private chat files
      const endpoints = privateChatId ? [
        `${apiUrl}/api/files/files/chat/${currentId}`,
        `${apiUrl}/api/files/files/batch/${currentId}`,
        `${apiUrl}/api/files/files/${currentId}`
      ] : [
        `${apiUrl}/api/files/files/batch/${currentId}`,
        `${apiUrl}/api/files/files/${currentId}`
      ];

      let response;
      let success = false;

      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, { credentials: 'include' });
          if (response.ok) {
            success = true;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (!success) {
        throw new Error('Failed to fetch files from all endpoints');
      }

      const result = await response.json();
      
      if (result.success) {
        setFiles(result.files || []);
        if (onFileCountUpdate) {
          onFileCountUpdate(result.files?.length || 0);
        }
      } else {
        setError(result.message || 'Failed to fetch files');
        setFiles([]);
      }
    } catch (error) {
      setError(`Failed to fetch files: ${error.message}`);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await fetch(`${apiUrl}/api/files/download/${fileId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success(`File "${filename}" downloaded successfully!`, { duration: 2000, style: { background: '#14b8a6', color: '#fff', fontWeight: 600, fontSize: '0.9rem' } });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file', { duration: 3000, style: { background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: '1rem' } });
    }
  };

  const handleDelete = async (fileId, filename) => {
    const confirmed = await new Promise((resolve) => {
      toast((t) => (
        <div className="toast-confirm-container">
          <div className="toast-confirm-title">Delete File</div>
          <div className="toast-confirm-message">Are you sure you want to delete "{filename}"?</div>
          <div className="toast-confirm-buttons">
            <button className="toast-confirm-btn toast-confirm-btn-cancel" onClick={() => { toast.dismiss(t.id); resolve(false); }}>Cancel</button>
            <button className="toast-confirm-btn toast-confirm-btn-confirm" onClick={() => { toast.dismiss(t.id); resolve(true); }}>Delete</button>
          </div>
        </div>
      ), { duration: Infinity, style: { background: '#fff', color: '#333', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxWidth: '350px', padding: '16px' } });
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`${apiUrl}/api/files/files/${fileId}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Delete failed'); }
      const updatedFiles = files.filter(file => file.fileId !== fileId);
      setFiles(updatedFiles);
      toast.success(`File "${filename}" deleted successfully!`, { duration: 3000, style: { background: '#14b8a6', color: '#fff', fontWeight: 600, fontSize: '1rem' } });
      if (onFileCountUpdate) onFileCountUpdate(updatedFiles.length);
      if (onFileDeleted) onFileDeleted(fileId);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete file: ${error.message}`, { duration: 3000, style: { background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: '1rem' } });
    }
  };

  const handleEdit = async (fileId) => {
    if (!editDescription.trim()) {
      toast.error('Please enter a description', {
        duration: 3000,
        style: {
          background: "#ef4444",
          color: "#fff",
          fontWeight: 600,
          fontSize: "1rem"
        }
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/files/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ description: editDescription })
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      // Update file in local state
      setFiles(files.map(file =>
        file.fileId === fileId
          ? { ...file, description: editDescription }
          : file
      ));

      setEditingFile(null);
      setEditDescription('');

      // Show success toast
      toast.success('File description updated successfully!', {
        duration: 3000,
        style: {
          background: "#14b8a6",
          color: "#fff",
          fontWeight: 600,
          fontSize: "1rem"
        }
      });
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update file description', {
        duration: 3000,
        style: {
          background: "#ef4444",
          color: "#fff",
          fontWeight: 600,
          fontSize: "1rem"
        }
      });
    }
  };

  const getFileIcon = (contentType) => {
    if (contentType.startsWith('image/')) return <Image size={20} />;
    if (contentType.startsWith('video/')) return <Video size={20} />;
    if (contentType.includes('pdf')) return <FileText size={20} />;
    if (contentType.includes('zip') || contentType.includes('rar')) return <Archive size={20} />;
    return <File size={20} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="file-viewer"><div className="file-viewer-content"><div className="loading-files">Loading files...</div></div></div>
    );
  }

  if (error) {
    return (
      <div className="file-viewer"><div className="file-viewer-content"><div className="error-message">{error}</div></div></div>
    );
  }

  return (
    <div className="file-viewer">
      <div className="file-viewer-content">
        {files.length === 0 ? (
          <div className="no-files">
            <FileX size={48} />
            <p>No files uploaded yet</p>
            <span>Files uploaded will appear here</span>
          </div>
        ) : (
          <div className="files-list">
            {files.map((file) => (
              <div key={file.fileId} className="file-item">
                <div className="file-info">
                  <div className="file-icon">{getFileIcon(file.contentType)}</div>
                  <div className="file-details">
                    <div className="file-name">{file.originalName || file.filename}</div>
                    <div className="file-meta">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>• {formatDate(file.uploadDate)}</span>
                      {(userRole === 'Admin' || userRole === 'Teacher') && (<><span>• By {file.uploadedByRole}</span></>)}
                    </div>
                    {file.description && (<div className="file-description">{file.description}</div>)}
                  </div>
                </div>

                <div className="file-actions">
                  {(userRole === 'Admin') && (
                  <>
                    <button className="action-btn download-btn" onClick={() => handleDownload(file.fileId, file.originalName || file.filename)} title="Download file">
                      <Download size={16} />
                    </button>
                  </>)}

                  {(userRole === 'Admin') && (
                  <>
                    <button className="action-btn delete-btn" onClick={() => handleDelete(file.fileId, file.originalName || file.filename)} title="Delete file">
                      <Trash2 size={16} />
                    </button>
                  </>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingFile && (
        <div className="edit-modal-overlay"><div className="edit-modal"><h4>Edit File Description</h4><textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Enter file description..." rows={3} /><div className="edit-actions"><button className="cancel-btn" onClick={() => { setEditingFile(null); setEditDescription(''); }}>Cancel</button><button className="save-btn" onClick={() => handleEdit(editingFile)}>Save</button></div></div></div>
      )}
    </div>
  );
};

export default FileViewer;