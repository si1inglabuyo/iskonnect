import { useState, useEffect } from 'react';
import api from '../lib/api';
import Avatar from './Avatar';
import { formatTimeAgo } from '../utils/formatTimeAgo';

export default function ShareComposer({ sharedPostId, onClose, onShared }) {
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [post, setPost] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchPost = async () => {
      try {
        const res = await api.get(`/api/posts/${sharedPostId}`);
        if (mounted) setPost(res.data);
      } catch (err) {
        console.error('Failed to load shared post preview:', err);
      }
    };
    fetchPost();
    return () => { mounted = false; };
  }, [sharedPostId]);

  const submitShare = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post('/api/posts', { content: caption.trim() || null, shared_post_id: sharedPostId });
      try {
        window.dispatchEvent(new CustomEvent('postShared', { detail: { postId: sharedPostId } }));
      } catch (e) {
        window.dispatchEvent(new Event('postShared'));
      }
      if (onShared) onShared();
    } catch (err) {
      console.error('Failed to share post:', err);
      alert(err.response?.data?.error || 'Failed to share post');
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-30 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-4">
        <h3 className="font-semibold mb-2">Share Post</h3>

        {post ? (
          <div className="mb-3 border rounded p-3 bg-gray-50">
            <div className="flex items-center gap-3 mb-2">
              <Avatar username={post.User?.Profile?.username} src={post.User?.Profile?.avatar_url} size="sm" />
              <div>
                <div className="font-medium text-sm">{post.User?.Profile?.username || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{formatTimeAgo(post.created_at || post.createdAt)}</div>
              </div>
            </div>
            {post.content && <p className="text-gray-700 mb-2 whitespace-pre-wrap">{post.content}</p>}
            {post.image_url && (
              <img src={post.image_url} alt="Shared" className="w-full max-h-48 object-cover rounded" />
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-3">Loading preview...</p>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption (optional)"
          className="w-full p-2 border rounded mb-3 resize-none"
          rows={4}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded bg-white border">Cancel</button>
          <button onClick={submitShare} disabled={submitting} className="px-3 py-1 bg-[#a51d28] text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {submitting ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
