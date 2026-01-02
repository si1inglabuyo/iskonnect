import { useState } from 'react';
import Avatar from './Avatar';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import CommentInput from './CommentInput';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function CommentThread({ comment, postId, postOwnerId, depth = 0, onNewComment }) {
     const { currentUser } = useAuth();
     const [isRepying, setIsReplying] = useState(false);
     const [deleting, setDeleting] = useState(false);
     const [isDeleted, setIsDeleted] = useState(false);
     const indentLevel = Math.min(depth, 3);
     const marginLeft = `${indentLevel * 16}px`;

     const handleDeleteComment = async () => {
          if (!window.confirm('Delete this comment?')) return;

          try {
               setDeleting(true);
               await api.delete(`/api/comments/${comment.id}`);
               setIsDeleted(true);
               if (onNewComment) onNewComment();
          } catch (err) {
               console.error('Failed to delete comment:', err);
               alert('Failed to delete comment');
               setDeleting(false);
          }
     };

     if (isDeleted) {
          return null;
     }

     // User can delete if they own the comment OR own the post
     const canDelete = currentUser && (currentUser.id === comment.user_id || currentUser.id === postOwnerId);

     return (
          <div className='flex flex-col' style={{ marginLeft }}>
               {/* Comment */}
               <div className='flex gap-3 py-2'>
                    <Avatar
                         username={comment.commenter_username}
                         size='sm'
                         src={comment.commenter_avatar}
                    />
                    <div className='flex-1'>
                         <div className='text-sm'>
                              <span className='font-semibold text-gray-800'>
                                   {comment.commenter_username || 'Anonymous'}
                              </span>
                              <span className='text-gray-700 ml-1'>{comment.content}</span>
                         </div>
                         <div className='flex items-center gap-4 mt-1'>
                              <span className='text-xs text-gray-500'>
                                   {formatTimeAgo(comment.created_at)}
                              </span>
                              <button
                                   onClick={() => setIsReplying(true)}
                                   className='text-xs text-indigo-600 hover:text-indigo-800'
                              >
                                   Reply
                              </button>
                              {canDelete && (
                                   <button
                                        onClick={handleDeleteComment}
                                        disabled={deleting}
                                        className='text-xs text-red-500 hover:text-red-700 disabled:text-gray-400'
                                   >
                                        {deleting ? 'Deleting...' : 'Delete'}
                                   </button>
                              )}
                         </div>
                    </div>
               </div>
               {/* Reply input */}
               {isRepying && (
                    <div className='ml-8 mt-2 pl-4 border-l-2 border-gray-200'>
                         <CommentInput
                              postId={postId}
                              parentId={comment.id}
                              onComment={() => {
                                   setIsReplying(false);
                                   if (onNewComment) onNewComment();
                              }}
                         />
                    </div>
               )}

               {/* Render child replies (if any) */}
               {comment.replies && comment.replies.length > 0 && (
                    <div className='mt-2'>
                         {comment.replies.map(reply => (
                              <CommentThread
                                   key={reply.id}
                                   comment={reply}
                                   postId={postId}
                                   postOwnerId={postOwnerId}
                                   depth={depth + 1}
                                   onNewComment={onNewComment}
                              />
                         ))}
                    </div>
               )}
          </div>
     );
}