const apiUrl = import.meta.env.VITE_API_URL;

export const fileService = {
  // Upload file
  uploadFile: async (file, batchSession, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('batchSession', batchSession);
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(`${apiUrl}/api/files/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Get files by batch
  getFilesByBatch: async (batchSession) => {
    const response = await fetch(`${apiUrl}/api/files/files/batch/${batchSession}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    return response.json();
  },

  // Download file
  downloadFile: async (fileId) => {
    const response = await fetch(`${apiUrl}/api/files/download/${fileId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  },

  // Update file
  updateFile: async (fileId, updates) => {
    const response = await fetch(`${apiUrl}/api/files/files/${fileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Update failed');
    }

    return response.json();
  },

  // Delete file
  deleteFile: async (fileId) => {
    const response = await fetch(`${apiUrl}/api/files/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    return response.json();
  },

  // Get user's batches
  getMyBatches: async () => {
    const response = await fetch(`${apiUrl}/api/files/my-batches`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch batches');
    }

    return response.json();
  }
};