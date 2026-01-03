import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import CreatePostForm from '../components/CreatePostForm'; 
import { formatTimeAgo, formatDateTime } from '../utils/formatTimeAgo';
import Avatar from '../components/Avatar';
import CommentInput from '../components/CommentInput';
import CommentThread from '../components/CommentThread';
import ImageModal from '../components/ImageModal';
import PostModal from '../components/PostModal';
import ShareComposer from '../components/ShareComposer';
import { useNavigate, useSearchParams } from 'react-router-dom';


// ── Main Feed Page ──
export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const { currentUser } = useAuth();
  const [tick, setTick] = useState(0);
  const [openComments, setOpenComments] = useState(new Set());
  const [commentsMap, setCommentsMap] = useState({});
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const navigate = useNavigate();

  // Update time every 30s

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await api.get('/api/posts');
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // Listen for save toggles from other components (e.g., PostModal)
  useEffect(() => {
    const onSaveToggled = (e) => {
      const { postId, saved } = e.detail || {};
      if (!postId) return;
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved_by_user: saved } : p));
    };

    window.addEventListener('saveToggled', onSaveToggled);
    const onPostShared = (e) => {
      fetchFeed();
    };
    window.addEventListener('postShared', onPostShared);
    return () => window.removeEventListener('saveToggled', onSaveToggled);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchSuggested = async () => {
      setLoadingSuggested(true);
      try {
        const res = await api.get('/api/users');
        setSuggestedUsers(res.data.slice(0,5));
      } catch (err) {
        console.error('Failed to fetch suggested users:', err);
      } finally {
        setLoadingSuggested(false);
      }
    };
    fetchSuggested();
  }, [currentUser]);

  

  const toggleLike = async (post) => {
    const originalPosts = [...posts];
    const updated = posts.map((p) => {
      if (p.id === post.id) {
        return {
          ...p,
          liked_by_user: !p.liked_by_user,
          like_count: p.liked_by_user ? (p.like_count || 1) - 1 : (p.like_count || 0) + 1,
        };
      }
      return p;
    });
    setPosts(updated);

    try {
      if (!post.liked_by_user) {
        await api.post('/api/likes', { post_id: post.id });
      } else {
        await api.delete(`/api/likes/${post.id}`);
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
      setPosts(originalPosts);
      alert(err.response?.data?.error || 'Failed to toggle like');
    }
  };


  const toggleComments = async (postId) => {
    const isOpen = openComments.has(postId);
    if (isOpen) {
      setOpenComments(prev => new Set([...prev].filter(id => id !== postId)));
    } else {
      //Load comments
      if(!commentsMap[postId]) {
        try {
          const res = await api.get(`/api/comments/${postId}`);
          setCommentsMap(prev => ({ ...prev, [postId]: res.data }));
        } catch (err) {
          console.error('Failed to load comments');
        }
      }
      setOpenComments(prev => new Set([...prev, postId]));
    }
  };

  
  const handleNewComment = (postId) => {
    // Refetch comments to include new one
    api.get(`/api/comments/${postId}`)
      .then(res => {
        setCommentsMap(prev => ({ ...prev, [postId]: res.data }));
      })
      .catch(err => console.error('Refetch comments failed'));
  };

  function buildCommentTree(comments) {
    const commentMap = {}
    const roots = [];

    // Index all comments by id
    comments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    // Build parent-child links
    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap[comment.parent_comment_id];
        if (parent) {
          parent.replies.push(commentMap[comment.id]);
        } 
      } else {
        roots.push(commentMap[comment.id]);
      }
    });

    return roots;
  }

  const handleFollow = async (userId) => {
    // Find the first post by this user to get current follow state
    const firstPostByUser = posts.find((post) => post.user_id === userId);
    if (!firstPostByUser) return;

    const wasFollowing = !!firstPostByUser.user_is_following;

    
    setPosts((prev) =>
      prev.map((post) =>
        post.user_id === userId ? { ...post, user_is_following: !wasFollowing } : post
      )
    );

    try {
      let res;
      if (wasFollowing) {
        res = await api.delete(`/api/follows/${userId}`);
      } else {
        res = await api.post('/api/follows', { following_id: userId });
      }

      // refresh feed and notify other components (ProfilePage) to update stats
      fetchFeed();
      const detail = res?.data || { userId };
      try {
        window.dispatchEvent(new CustomEvent('followStatusChanged', { detail }));
      } catch (e) {
        window.dispatchEvent(new Event('followStatusChanged'));
      }
    } catch (err) {
      // Revert optimistic change on error
      setPosts((prev) =>
        prev.map((post) =>
          post.user_id === userId ? { ...post, user_is_following: wasFollowing } : post
        )
      );
      const message = err.response?.data?.error || 'Failed to update follow status';
      alert(message);
    }
  };

  const toggleSave = async (post) => {
    const originalPosts = [...posts];
    const wasSaved = post.saved_by_user;
    const updated = posts.map(p => {
      if (p.id === post.id) {
        return { ...p, saved_by_user: !p.saved_by_user };
      }
      return p;
    });

    setPosts(updated);

    // Optimistically notify other parts of the app immediately
    const pid = post?.id || post.id;
    const newSaved = !wasSaved;
    window.dispatchEvent(new CustomEvent('saveToggled', { detail: { postId: pid, saved: newSaved } }));

    try {
      if (!wasSaved) {
        await api.post('/api/saves', { post_id: post.id });
      } else {
        await api.delete(`/api/saves/${post.id}`);
      }
    } catch (err) {
      console.error('Save toggel failed:', err);
      setPosts(originalPosts);
      // Revert the event dispatch on error
      window.dispatchEvent(new CustomEvent('saveToggled', { detail: { postId: pid, saved: wasSaved } }));
      alert('Failed to update save status');
    }
  };

  const [shareTarget, setShareTarget] = useState(null);

  const handleShare = (post) => {
    if (!currentUser) return alert('You must be logged in to share posts');
    setShareTarget(post.id);
  };

  const closeShareComposer = () => setShareTarget(null);

  const onShared = () => {
    fetchFeed();
    alert('Post shared');
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/api/posts/${postId}`);
      setPosts(posts.filter(p => p.id !== postId));
      alert('Post deleted successfully');
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Failed to delete post');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full">
        <div className="flex justify-center gap-2 sm:gap-4 md:gap-6">
          {/* Main Feed - Center */}
        <div className="w-full max-w-2xl p-2 sm:p-3 md:p-4">
        {/* Create Post Card */}
        <div className="mb-8 p-4 sm:p-5 bg-white rounded-xl shadow-sm border">
          <h2 className="font-semibold text-lg mb-3">Create Post</h2>
          <CreatePostForm onPost={fetchFeed} />
        </div>

        {/* Posts Feed */}
        <div className="space-y-6 pb-8">
        {posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No posts yet. Follow someone to see their content!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl shadow border p-4 sm:p-5 hover:shadow-md transition-shadow"
            >
              {/* Header: Avatar + Username + Follow */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.user_id}`); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); navigate(`/profile/${post.user_id}`); } }}
                  >
                    <Avatar
                      username={post.User?.Profile?.username}
                      email={post.User?.email}
                      size="md"
                      src={post.User?.Profile?.avatar_url}
                    />
                  </div>
                  <div className='flex flex-col'>
                    <span
                      className="font-semibold text-sm sm:text-base text-gray-800 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.user_id}`); }}
                    >
                      {post.User?.Profile?.username || 'Unknown User'}
                    </span>
                    <div className='text-[0.65rem] text-gray-500'>
                      {formatDateTime(post.createdAt || post.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentUser && currentUser.id === post.user_id && (
                    <>
                    <button
                      className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setEditingPostId(post.id); setEditContent(post.content || ''); }}
                      title="Edit post"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      onClick={() => handleDeletePost(post.id)}
                      title="Delete post"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant={post.user_is_following ? "destructive" : "ghost"}
                    onClick={() => handleFollow(post.user_id)}
                    disabled={currentUser && post.user_id === currentUser.id}
                  >
                    {currentUser && post.user_id === currentUser.id 
                      ? 'You' 
                      : post.user_is_following
                      ? 'Following'
                      : 'Follow'}
                  </Button>
                </div>
                
              </div>

              {/* Image (if exists) */}
              {post.image_url && (
                <div className="mb-3">
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full max-h-96 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(post.image_url)}
                  />
                </div>
              )}

              {/* Text Content (if exists) or Edit Mode */}
              {editingPostId === post.id ? (
                <div className="mb-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full p-2 border rounded mb-2 resize-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditingPostId(null); setEditContent(''); }}
                      className="px-3 py-1 rounded bg-white border"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (savingEdit) return;
                        setSavingEdit(true);
                        try {
                          const res = await api.put(`/api/posts/${post.id}`, { content: editContent });
                          setPosts(prev => prev.map(p => p.id === post.id ? { ...p, content: res.data.content } : p));
                          try { window.dispatchEvent(new CustomEvent('postEdited', { detail: { postId: post.id } })); } catch (err) { window.dispatchEvent(new Event('postEdited')); }
                          setEditingPostId(null);
                          setEditContent('');
                        } catch (err) {
                          console.error('Failed to save edit:', err);
                          alert(err.response?.data?.error || 'Failed to save changes');
                        } finally {
                          setSavingEdit(false);
                        }
                      }}
                      className="px-3 py-1 bg-[#a51d28] text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                post.content && (
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>
                )
              )}

              {/* If this post is a share of another post, render the original post */}
              {post.SharedPost && (
                <div
                  className="mt-4 border-l-2 border-gray-200 pl-4 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => setSelectedPost(post.SharedPost)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelectedPost(post.SharedPost); }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 mb-1">
                      Shared from 
                      <span
                        className="font-medium text-gray-800 cursor-pointer ml-1"
                        onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.SharedPost.user_id}`); }}
                      >
                        {post.SharedPost.User?.Profile?.username || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  {post.SharedPost.content && (
                    <p className="text-gray-700 whitespace-pre-wrap">{post.SharedPost.content}</p>
                  )}
                  {post.SharedPost.image_url && (
                    <img src={post.SharedPost.image_url} alt="Shared" className="mt-2 w-full max-h-72 object-cover rounded" />
                  )}
                </div>
              )}

              <div className='flex items-center gap-2 sm:gap-3 mt-4 -ml-1 sm:-ml-3'>
                {/* Like Button */}
                <Button
                  onClick={() => toggleLike(post)}
                  size="sm"
                  variant={post.liked_by_user ? 'solid' : 'ghost'}
                  className={`flex items-center gap-2 ${post.liked_by_user ? 'text-gray-600' : 'text-gray-600 hover:text-red-500'}`}

                >

                {post.liked_by_user ? (
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-red-500"
                  >
                    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"/>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-5 h-5 text-red-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"
                    />
                  </svg>
                )}
                  <span className="hidden sm:inline">{post.liked_by_user ? 'Likes' : 'Like'}</span>
                  <span className="text-sm text-gray-500">{post.like_count || 0}</span>
                </Button>

                {/* Comment Button */}

                <Button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1 text-sm text-gray-600"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" viewBox="0 0 24 24" 
                    stroke-width="1.5" stroke="currentColor" 
                    className="size-6"
                  >
                    <path 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" 
                    />
                  </svg>
                  <span className="hidden sm:inline">Comment</span>
                </Button>

                {/* Save button */}
                <Button
                  onClick={() => toggleSave(post)}
                  size="sm"
                  variant="ghost"
                  className={`flex items-center gap-1 text-sm ${
                    post.saved_by_user ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'
                  }`}
                >
                {post.saved_by_user ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    class="size-6"
                  >
                    <path 
                      fill-rule="evenodd" 
                      d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" 
                      clip-rule="evenodd" 
                    />
                  </svg>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke-width="1.5" 
                    stroke="currentColor" 
                    class="size-6"
                  >
                    <path 
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" 
                    />
                  </svg>
                )}
                  <span className="hidden sm:inline">{post.saved_by_user ? 'Saved' : 'Save'}</span>
                </Button>

                {/* Share button */}
                <Button
                  onClick={() => handleShare(post)}
                  size="sm"
                  variant="ghost"
                  className="flex items-center gap-1 text-sm text-gray-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                      <path fillRule="evenodd" d="M12 5.25c1.213 0 2.415.046 3.605.135a3.256 3.256 0 0 1 3.01 3.01c.044.583.077 1.17.1 1.759L17.03 8.47a.75.75 0 1 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0-1.06-1.06l-1.752 1.751c-.023-.65-.06-1.296-.108-1.939a4.756 4.756 0 0 0-4.392-4.392 49.422 49.422 0 0 0-7.436 0A4.756 4.756 0 0 0 3.89 8.282c-.017.224-.033.447-.046.672a.75.75 0 1 0 1.497.092c.013-.217.028-.434.044-.651a3.256 3.256 0 0 1 3.01-3.01c1.19-.09 2.392-.135 3.605-.135Zm-6.97 6.22a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.752-1.751c.023.65.06 1.296.108 1.939a4.756 4.756 0 0 0 4.392 4.392 49.413 49.413 0 0 0 7.436 0 4.756 4.756 0 0 0 4.392-4.392c.017-.223.032-.447.046-.672a.75.75 0 0 0-1.497-.092c-.013.217-.028.434-.044.651a3.256 3.256 0 0 1-3.01 3.01 47.953 47.953 0 0 1-7.21 0 3.256 3.256 0 0 1-3.01-3.01 47.759 47.759 0 0 1-.1-1.759L6.97 15.53a.75.75 0 0 0 1.06-1.06l-3-3Z" clipRule="evenodd" />
                    </svg>
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </div>

              {/* Comment Section */}
              <div className='mt-4'>
                <Button
                  onClick={() => toggleComments(post.id)}
                  className='text-sm text-gray-500 hover:text-gray-700 pl-1'
                >
                  {openComments.has(post.id) 
                    ? 'Hide comments' 
                    : post.comment_count > 0
                      ? `${post.comment_count} comment${post.comment_count !== 1 ? 's' : ''}`
                      : 'Comment'
                  }
                </Button>
                {openComments.has(post.id) && (
                  <div className='mt-3 space-y-3'>
                    {commentsMap[post.id] ? (
                      buildCommentTree(commentsMap[post.id]).map(comment => (
                        <CommentThread
                          key={comment.id}
                          comment={comment}
                          postId={post.id}
                          postOwnerId={post.user_id}
                          onNewComment={() => handleNewComment(post.id)}
                        />
                      ))
                    ) : (
                      <p className='text-gray-500 text-sm'>No comments yet.</p>
                    )}
                    <div className='pt-4 border-t border-gray-200'>
                      <CommentInput 
                        postId={post.id} 
                        onComment={() => handleNewComment(post.id)} 
                      />

                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* Suggested Users - Right Sidebar */}
      <div className="w-64 xl:w-80 sticky top-6 h-fit hidden lg:block">
        <div className="p-5 bg-white rounded-xl shadow-sm border">
          <div className='mb-4 flex justify-between items-center'>
            <h2 className='text-lg font-bold text-gray-900'>Suggested Isko/Iska</h2>
            <button
              onClick={() => navigate('/discover')}
              className='text-xs text-indigo-600 hover:text-indigo-800 font-medium'
            >
              See All
            </button>
          </div>

          {/* Suggested for you Section */}
          {loadingSuggested ? (
            <p className="text-center py-4 text-gray-500">Loading...</p>
          ) : suggestedUsers.length > 0 ? (
            <div className="space-y-3">
              {suggestedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between gap-2 p-3 hover:bg-gray-50 rounded-lg transition-colors overflow-hidden">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar 
                      username={user.Profile?.username}
                      src={user.Profile?.avatar_url}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 truncate">{user.Profile?.username || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.mutual_count > 0 && user.mutual_username
                          ? user.mutual_count > 1
                            ? `Followed by ${user.mutual_username} + ${user.mutual_count - 1} more`
                            : `Followed by ${user.mutual_username}`
                          : 'No mutuals yet'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={async () => {
                        try {
                          await api.post('/api/follows', { following_id: user.id });
                          setSuggestedUsers(prev => prev.filter(u => u.id !== user.id));
                        } catch (err) {
                          console.error('Follow error:', err);
                        }
                      }}
                    >
                      Follow
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No suggestions yet.</p>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}

      {/* Post Modal for opening original/shared posts */}
      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
      {shareTarget && (
        <ShareComposer sharedPostId={shareTarget} onClose={closeShareComposer} onShared={onShared} />
      )}
    </div>
    
      </div>
      
    </div>
  );
}
