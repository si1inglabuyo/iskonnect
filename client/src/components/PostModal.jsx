 import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import Avatar from './Avatar';
import { formatTimeAgo, formatDateTime } from '../utils/formatTimeAgo';
import CommentThread from './CommentThread';
import CommentInput from './CommentInput';
import ImageModal from './ImageModal';
import { Button } from './ui/button';
import ShareComposer from './ShareComposer';

export default function PostModal({ post, onClose }) {
     const { currentUser } = useAuth();
     const navigate = useNavigate();
     const [loadingPost, setLoadingPost] = useState(false);
     const [comments, setComments] = useState([]);
     const [showComments, setShowComments] = useState(false);
     const [selectedImage, setSelectedImage] = useState(null);
     const [localPost, setLocalPost] = useState({
          ...post,
          like_count: post.like_count ?? 0,
          liked_by_user: post.liked_by_user ?? false
     });
     const [openOriginalPost, setOpenOriginalPost] = useState(null);
     const [deleting, setDeleting] = useState(false);
     const [isEditing, setIsEditing] = useState(false);
     const [editContent, setEditContent] = useState(localPost.content || '');
     const [savingEdit, setSavingEdit] = useState(false);
          
     // Fetch comments for .this post
     const fetchComments = async () => {
          try {
               const res = await api.get(`/api/comments/${post.id}`);
               setComments(res.data);
          } catch (err) {
               console.error('Failed to fetch comments');
          }
     };

     // Handle delete post
     const handleDeletePost = async () => {
          if (!window.confirm('Are you sure you want to delete this post?')) return;

          try {
               setDeleting(true);
               await api.delete(`/api/posts/${localPost.id}`);
               alert('Post deleted successfully');
               window.dispatchEvent(new CustomEvent('postDeleted', { detail: { postId: post.id } }));
               onClose();
          } catch (err) {
               console.error('Failed to delete post:', err);
               alert('Failed to delete post');
          } finally {
               setDeleting(false);
          }
     };

     // Handle like toggel
     const toggleLike = async () => {
         const wasLiked = localPost.liked_by_user;
         const newLikeCount = wasLiked ? Math.max(0, localPost.like_count - 1) : localPost.like_count + 1;
          
         setLocalPost(prev => ({
               ...prev,
               liked_by_user: !wasLiked,
               like_count: newLikeCount 
         }));

          try {
               if (wasLiked) {
                    await api.delete(`/api/likes/${localPost.id}`);
               } else {
                    await api.post(`/api/likes`, { post_id: localPost.id });
               }

                window.dispatchEvent(new CustomEvent('likeToggled', { detail: { postId: post.id } }));

          }  catch (err) {
               setLocalPost(prev => ({
                    ...prev,
                    liked_by_user: wasLiked,
                    like_count: wasLiked ? prev.like_count + 1 : Math.max(0, prev.like_count - 1)               
               }));
               alert('Failed to toggle like');
          }
     };

          // Handle save toggle
          const toggleSave = async () => {
               const wasSaved = localPost.saved_by_user;
          
               setLocalPost(prev => ({
                    ...prev,
                    saved_by_user: !wasSaved
               }));

               // Notify other parts of the app immediately for update
               const pid = localPost?.id || post.id;
               const newSaved = !wasSaved;
               window.dispatchEvent(new CustomEvent('saveToggled', { detail: { postId: pid, saved: newSaved } }));

               try {
                    if (wasSaved) {
                         await api.delete(`/api/saves/${pid}`);
                    } else {
                         await api.post(`/api/saves`, { post_id: pid });
                    }
               } catch (err) {
                    // Revert optimistic changes on error
                    setLocalPost(prev => ({
                         ...prev,
                         saved_by_user: wasSaved
                    }));
                    window.dispatchEvent(new CustomEvent('saveToggled', { detail: { postId: pid, saved: wasSaved } }));
                    alert('Failed to toggle save');
               }
          };

          const [showShareComposer, setShowShareComposer] = useState(false);

          const openShareComposer = () => {
               if (!currentUser) return alert('You must be logged in to share posts');
               setShowShareComposer(true);
          };

    
     useEffect(() => {
          const fetchFullPost = async () => {
               try {
                    setLoadingPost(true);
                    const res = await api.get(`/api/posts/${post.id}`);
                    const fullPost = res.data;
                    setLocalPost({
                         ...fullPost,
                         like_count: fullPost.like_count ?? 0,
                             liked_by_user: fullPost.liked_by_user ?? false,
                             saved_by_user: fullPost.saved_by_user ?? false
                    })
               } catch (err) {
                    console.error('Failed to fetch full post data in modal');
                    setLocalPost({
                         ...post,
                         like_count: post.like_count ?? 0,
                             liked_by_user: post.liked_by_user ?? false,
                             saved_by_user: post.saved_by_user ?? false
                    });
               } finally {
                    setLoadingPost(false);
               }
          };
          fetchComments();
          fetchFullPost();
     }, []);

     // Build indent comment
     function buildCommentTree(comments) {
          const commentMap = {};
          const roots = [];

          comments.forEach(comment => {
               commentMap[comment.id] = { ...comment, replies: [] };
          });

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


     const toggleComments = () => setShowComments(prev => !prev);

     return (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30'>
               <div className='bg-white rounded-lg w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto'>
                    {/* Header */}
                    <div className='p-4 border-b flex items-center gap-3'>
                         <div
                              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${localPost.user_id}`); }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); navigate(`/profile/${localPost.user_id}`); } }}
                              className="cursor-pointer flex items-center gap-3"
                         >
                              <Avatar username={localPost.User?.Profile?.username} src={localPost.User?.Profile?.avatar_url} size="sm" />
                              <span className="font-semibold">{localPost.User?.Profile?.username || 'Anonymous'}</span>
                         </div>
                         <span className="text-xs text-gray-500">{formatDateTime(localPost.created_at)}</span>
                         <div className="ml-auto flex items-center gap-2">
                              {currentUser && currentUser.id === localPost.user_id && (
                                   <>
                                        <button
                                             onClick={() => { setIsEditing(true); setEditContent(localPost.content || ''); }}
                                             className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                                             title="Edit post"
                                        >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                             </svg>
                                        </button>
                                        <button
                                             onClick={handleDeletePost}
                                             disabled={deleting}
                                             className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-400 transition-colors"
                                             title="Delete post"
                                        >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                             </svg>
                                        </button>
                                   </>
                              )}
                              <button 
                                   onClick={onClose} 
                                   className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                   ✕
                              </button>
                         </div>
                                        {/* Nested original post modal (when user clicks a shared post inside this modal) */}
                                        {openOriginalPost && (
                                             <PostModal post={openOriginalPost} onClose={() => setOpenOriginalPost(null)} />
                                        )}
                    </div>
                    {/* Post Content */}
                    <div className='p-4'>
                         {/* Image */}
                             {localPost.image_url && (
                              <div className='mb-3'>
                                   <img 
                                        src={localPost.image_url} 
                                        alt="" 
                                        className='w-full max-h-96 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity'
                                        onClick={() => setSelectedImage(localPost.image_url)}
                                   />
                              </div>
                         )}

                         {/* Edit mode caption */}
                         {isEditing ? (
                              <div className="mb-4">
                                   <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows={4}
                                        className="w-full p-2 border rounded mb-2 resize-none"
                                   />
                                   <div className="flex gap-2 justify-end">
                                        <button type="button" onClick={() => { setIsEditing(false); setEditContent(localPost.content || ''); }} className="px-3 py-1 rounded bg-white border">Cancel</button>
                                        <button type="button" onClick={async () => {
                                             if (savingEdit) return;
                                             setSavingEdit(true);
                                             try {
                                                  const res = await api.put(`/api/posts/${localPost.id}`, { content: editContent });
                                                  setLocalPost(prev => ({ ...prev, content: res.data.content }));
                                                  try { window.dispatchEvent(new CustomEvent('postEdited', { detail: { postId: localPost.id } })); } catch (e) { window.dispatchEvent(new Event('postEdited')); }
                                                  setIsEditing(false);
                                             } catch (err) {
                                                  console.error('Failed to save edit:', err);
                                                  alert(err.response?.data?.error || 'Failed to save changes');
                                             } finally {
                                                  setSavingEdit(false);
                                             }
                                        }} className="px-3 py-1 bg-[#a51d28] text-white rounded hover:bg-red-700 disabled:opacity-50">{savingEdit ? 'Saving...' : 'Save'}</button>
                                   </div>
                              </div>
                         ) : (
                              localPost.content && (
                                   <p className="text-gray-700 mb-4 whitespace-pre-wrap">{localPost.content}</p>
                              )
                         )}

                         {/* Liked & Comment */}

                         {/*If this is a shared post, show shared content clickable to open original*/}
                         {localPost.SharedPost && (
                              <div
                                   className="mt-4 border-l-2 border-gray-200 pl-4 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                   onClick={() => setOpenOriginalPost(localPost.SharedPost)}
                                   role="button"
                                   tabIndex={0}
                                   onKeyDown={(e) => { if (e.key === 'Enter') setOpenOriginalPost(localPost.SharedPost); }}
                              >
                                   <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600 mb-1">
                                             Shared from 
                                             <span
                                                  className="font-medium text-gray-800 cursor-pointer ml-1"
                                                  onClick={(e) => { e.stopPropagation(); navigate(`/profile/${localPost.SharedPost.user_id}`); }}
                                             >
                                                  {localPost.SharedPost.User?.Profile?.username || 'Unknown'}
                                             </span>
                                        </div>
                                   </div>
                                   {localPost.SharedPost.content && (
                                        <p className="text-gray-700 whitespace-pre-wrap">{localPost.SharedPost.content}</p>
                                   )}
                                   {localPost.SharedPost.image_url && (
                                        <img src={localPost.SharedPost.image_url} alt="Shared" className="mt-2 w-full max-h-72 object-cover rounded" />
                                   )}
                              </div>
                         )}

                         {/*Like buton */}
                        
                         <div className='flex items-center gap-3 -ml-4'> 
                              <Button
                                   onClick={toggleLike}
                                   className={`flex items-center gap-2 ${localPost.liked_by_user ? 'text-red-500' : 'text-gray-600'}`}
                              >
                                   {localPost.liked_by_user ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500">
                                             <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"/>
                                        </svg>
                                   ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-red-500">
                                             <path strokeLinecap="round" strokeLinejoin="round" d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                                        </svg>
                                   )}
                                           <span className="hidden sm:inline">{localPost.liked_by_user ? 'Liked' : 'Like'}</span>
                                           <span className="text-sm text-gray-500">{localPost.like_count || 0}</span>
                              </Button>


                              {/* Comment Button */}

                              <Button
                              onClick={toggleComments}
                              className="flex items-center gap-1 text-sm text-gray-600"
                              >
                              <svg 
                                   xmlns="http://www.w3.org/2000/svg" 
                                   fill="none" viewBox="0 0 24 24" 
                                   stroke-width="1.5" stroke="currentColor" 
                                   class="size-6"
                              >
                                   <path 
                                   stroke-linecap="round" 
                                   stroke-linejoin="round" 
                                   d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                              </svg>
                              <span className="hidden sm:inline">Comment</span>
                              </Button>

                                   {/* Save Button */}
                                   <Button
                                        onClick={toggleSave}
                                        className={`flex items-center gap-1 text-sm ${
                                             localPost.saved_by_user ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'
                                        }`}
                                   >
                                        {localPost.saved_by_user ? (
                                             <svg 
                                                  xmlns="http://www.w3.org/2000/svg" 
                                                  viewBox="0 0 24 24" 
                                                  fill="currentColor" 
                                                  className="w-5 h-5"
                                             >
                                                  <path 
                                                       fillRule="evenodd" 
                                                       d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" 
                                                       clipRule="evenodd" 
                                                  />
                                             </svg>
                                        ) : (
                                             <svg 
                                                  xmlns="http://www.w3.org/2000/svg" 
                                                  fill="none" 
                                                  viewBox="0 0 24 24" 
                                                  strokeWidth="1.5" 
                                                  stroke="currentColor" 
                                                  className="w-5 h-5"
                                             >
                                                  <path 
                                                       strokeLinecap="round" 
                                                       strokeLinejoin="round" 
                                                       d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" 
                                                  />
                                             </svg>
                                        )}
                                            <span className="hidden sm:inline">{localPost.saved_by_user ? 'Saved' : 'Save'}</span>
                                   </Button>
                                   <Button
                                        onClick={openShareComposer}
                                        className="flex items-center gap-1 text-sm text-gray-600"
                                   >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                                             <path fillRule="evenodd" d="M12 5.25c1.213 0 2.415.046 3.605.135a3.256 3.256 0 0 1 3.01 3.01c.044.583.077 1.17.1 1.759L17.03 8.47a.75.75 0 1 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0-1.06-1.06l-1.752 1.751c-.023-.65-.06-1.296-.108-1.939a4.756 4.756 0 0 0-4.392-4.392 49.422 49.422 0 0 0-7.436 0A4.756 4.756 0 0 0 3.89 8.282c-.017.224-.033.447-.046.672a.75.75 0 1 0 1.497.092c.013-.217.028-.434.044-.651a3.256 3.256 0 0 1 3.01-3.01c1.19-.09 2.392-.135 3.605-.135Zm-6.97 6.22a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.752-1.751c.023.65.06 1.296.108 1.939a4.756 4.756 0 0 0 4.392 4.392 49.413 49.413 0 0 0 7.436 0 4.756 4.756 0 0 0 4.392-4.392c.017-.223.032-.447.046-.672a.75.75 0 0 0-1.497-.092c-.013.217-.028.434-.044.651a3.256 3.256 0 0 1-3.01 3.01 47.953 47.953 0 0 1-7.21 0 3.256 3.256 0 0 1-3.01-3.01 47.759 47.759 0 0 1-.1-1.759L6.97 15.53a.75.75 0 0 0 1.06-1.06l-3-3Z" clipRule="evenodd" />
                                        </svg>
                                            <span className="hidden sm:inline">Share</span>
                                   </Button>
                                        {showShareComposer && (
                                             <ShareComposer
                                                  sharedPostId={localPost.id}
                                                  onClose={() => setShowShareComposer(false)}
                                                  onShared={() => { alert('Post shared'); onClose(); }}
                                             />
                                        )}
                         </div>

                         {/* Comments Toggle */}
                         <Button
                              onClick={toggleComments}
                              className='text-sm text-gray-500 hover:text-gray-700 pl-1'
                         >
                              {showComments ? 'Hide comments' : comments.length > 0 ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}` : 'Comment'}
                         </Button>
                         

                         {/* Comments Section */}
                         {showComments && (
                         <div className='mt-3 space-y-3'>
                              <h3 className='text-lg font-semibold'>Comments</h3>
                              {comments.length > 0 ? (
                                   buildCommentTree(comments).map(comment => (
                                   <CommentThread
                                        key={comment.id}
                                        comment={comment}
                                        postId={localPost.id}
                                        postOwnerId={localPost.user_id}
                                        onNewComment={fetchComments}
                                   />
                                   ))
                              ) : (
                                   <p className='text-gray-500'>No comments yet.</p>
                              )}
                              {currentUser && (
                                   <div className='pt-4 border-t border-gray-200'>
                                   <CommentInput
                                        postId={localPost.id}
                                        onComment={fetchComments}
                                   />
                                   </div>
                              )}
                         </div>
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
          </div>
     );
}