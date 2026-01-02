import { useState, useEffect } from 'react';
import api from '../lib/api';
import Avatar from './Avatar';

export default function GroupSettingsModal({ isOpen, onClose, conversation, onUpdate, onLeave }) {
  const [groupName, setGroupName] = useState(conversation?.group_name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(conversation?.group_avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const currentMemberIds = conversation?.members?.map(m => m.id) || [];

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type.startsWith('image/')) {
      setAvatarFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await api.get(`/api/search?q=${encodeURIComponent(query)}`);
      // Filter out already members - search endpoint returns { users, posts }
      const filtered = (res.data.users || []).filter(user => !currentMemberIds.includes(user.id));
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post(`/api/messages/group/${conversation.id}/members`, {
        member_ids: selectedUsers.map(u => u.id)
      });
      
      // Update conversation with new members
      const updatedMembers = [...conversation.members, ...selectedUsers];
      onUpdate({ members: updatedMembers });
      
      setSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
      alert('Members added successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Group name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.put(`/api/messages/group/${conversation.id}/name`, {
        group_name: groupName
      });
      onUpdate({ group_name: groupName });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update group name');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhoto = async (e) => {
    e.preventDefault();
    if (!avatarFile) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Upload image
      const formData = new FormData();
      formData.append('image', avatarFile);
      const uploadRes = await api.post('/api/upload', formData);
      const group_avatar_url = uploadRes.data.url;

      // Update group with avatar URL
      await api.put(`/api/messages/group/${conversation.id}/photo`, {
        group_avatar_url
      });
      onUpdate({ group_avatar_url });
      setAvatarFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update group photo');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    setLoading(true);
    setError('');
    try {
      await api.delete(`/api/messages/group/${conversation.id}/leave`);
      onLeave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-30">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Group Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Group Avatar with Edit Icon */}
          <div className="flex justify-center">
            <div className="relative inline-block group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Group"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-10 w-10 text-white"
                  >
                    <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
                    <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
                  </svg>
                </div>
              )}
              
              {/* Edit Icon Overlay */}
              <button
                type="button"
                onClick={() => document.getElementById('avatarFileInput').click()}
                className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-40 flex items-center justify-center transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                  <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </button>

              {/* Hidden File Input */}
              <input
                id="avatarFileInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Upload Button - Only show if file is selected */}
          {avatarFile && (
            <button
              onClick={handleUpdatePhoto}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Save Avatar'}
            </button>
          )}

          {/* Edit Group Name */}
          <form onSubmit={handleUpdateName}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || groupName === conversation?.group_name}
              className="mt-2 w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 border border-gray-400 rounded shadow"
            >
              Update Name
            </button>
          </form>


          {/* Add Members Section */}
          <div className="pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Members
            </label>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearchUsers(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            />

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                {searchResults.map(user => (
                  <label
                    key={user.id}
                    className="flex items-center gap-2 p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.some(u => u.id === user.id)}
                      onChange={() => toggleUserSelection(user)}
                      className="w-4 h-4"
                    />
                    <Avatar
                      username={user.username}
                      src={user.avatar_url}
                      size="sm"
                    />
                    <span className="text-sm">{user.username}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-700 mb-1">
                  Selected: {selectedUsers.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-2"
                    >
                      <Avatar
                        username={user.username}
                        src={user.avatar_url}
                        size="xs"
                      />
                      {user.username}
                      <button
                        type="button"
                        onClick={() => toggleUserSelection(user)}
                        className="font-bold hover:text-blue-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAddMembers}
              disabled={loading || selectedUsers.length === 0}
              className="mt-2 w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 border border-gray-400 rounded shadow"
            >
              Add Selected Members
            </button>
          </div>

          {/* Members Count */}
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{conversation?.members?.length || 0}</span> members in this group
            </p>
          </div>

          {/* Leave Group Button */}
          <button
            onClick={handleLeaveGroup}
            disabled={loading}
            className="w-full bg-[#a51d28] text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
}
