import { useEffect, useState } from 'react';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { useNavigate } from 'react-router-dom';

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/friends');
        setFriends(res.data || []);
      } catch (err) {
        console.error('Failed to fetch friends', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  const filtered = friends.filter(f => {
    const username = f.Profile?.username || '';
    return username.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Friends</h1>
      <div className="mb-4">
        <input
          className="w-full p-2 border rounded-md"
          placeholder="Search friends by username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No friends found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(fr => (
            <div key={fr.id} className="p-3 bg-white rounded-lg shadow-sm flex items-center gap-3">
              <div onClick={() => navigate(`/profile/${fr.id}`)} className="cursor-pointer">
                <Avatar username={fr.Profile?.username} src={fr.Profile?.avatar_url} size="sm" />
              </div>
              <div className="flex-1">
                <div className="font-semibold cursor-pointer" onClick={() => navigate(`/profile/${fr.id}`)}>{fr.Profile?.username || 'User'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
