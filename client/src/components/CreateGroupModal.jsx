import { useState, useEffect } from 'react';
import api from '../lib/api';
import Avatar from './Avatar';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setSearching(true);
    try {
      const res = await api.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      // API returns { users, posts }
      const found = (res.data && res.data.users) ? res.data.users : [];
      // Filter out already selected members
      const filtered = found.filter(
        user => !selectedMembers.find(m => m.id === user.id)
      );
      setUsers(filtered);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const toggleMember = (user) => {
    if (selectedMembers.find(m => m.id === user.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== user.id));
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (selectedMembers.length < 1) {
      alert('Please select at least one member');
      return;
    }

    setLoading(true);
    try {
      const memberIds = selectedMembers.map(m => m.id);
      const res = await api.post('/api/messages/group/create', {
        group_name: groupName,
        member_ids: memberIds
      });

      onGroupCreated(res.data);
      onClose();
      setGroupName('');
      setSelectedMembers([]);
      setSearchQuery('');
    } catch (err) {
      console.error('Create group error:', err);
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create Group</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="space-y-4">
          {/* Group Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Search Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Members
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for users..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Members ({selectedMembers.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-1 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{member.username}</span>
                    <button
                      type="button"
                      onClick={() => toggleMember(member)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery && (
            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-center text-gray-500">Searching...</div>
              ) : users.length > 0 ? (
                <div className="divide-y">
                  {users.map(user => (
                    <div
                      key={user.id}
                      onClick={() => toggleMember(user)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <Avatar
                        username={user.username}
                        src={user.avatar_url}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.bio || ''}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMembers.some(m => m.id === user.id)}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">No users found</div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !groupName.trim() || selectedMembers.length === 0}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
