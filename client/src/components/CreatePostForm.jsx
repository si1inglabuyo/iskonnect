// src/components/CreatePostForm.jsx
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import api from '../lib/api';

export default function CreatePostForm({ onPost }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        alert('Please select an image file (jpg, png, etc.)');
        return;
      }
      // revoke previous preview URL if present 
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const clearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) {
      alert('Post must have text or an image');
      return;
    }

    setUploading(true);
    let imageUrl = '';

    // Upload image if selected
    if (file) {
      const formData = new FormData();
      formData.append('image', file);

      try {
        // Let axios detect FormData and set the proper Content-Type (including boundary)
        const uploadRes = await api.post('/api/upload', formData);
        imageUrl = uploadRes.data.url;
      } catch (err) {
        console.error('Image upload failed:', err.response || err);
        alert('Failed to upload image. Please try again.');
        setUploading(false);
        return;
      }
    }

    // Create post
    try {
      await api.post('/api/posts', {
        content: content.trim() || null,
        image_url: imageUrl || null,
      });
      setContent('');
      // clear and revoke preview URL if any
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onPost) onPost(); // refresh feed
    } catch (err) {
      console.error('Post creation failed:', err.response || err);
      alert('Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-none"
        rows="3"
      />

      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="block w-full text-sm bg-white file:hover:bg-gray-100 cursor-pointer text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:shadow-lg file:text-sm file:font-semibold border-gray-400 file:rounded-shadow"
        />
        {previewUrl && (
          <div className="mt-3 relative">
            <button
              type="button"
              onClick={clearImage}
              aria-label="Remove image"
              className="absolute top-2 right-2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 text-gray-800 shadow"
            >
              ×
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-64 object-cover rounded-lg"
            />
          </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={uploading} 
        className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
      >
        {uploading ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}