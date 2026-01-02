import { useState } from 'react';
import Avatar from './Avatar';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import CommentInput from './CommentInput';

export default function CommentItem({ comment, postId, onNewComment }) {
   const [isRepying, setIsReplying] = useState(false);

   return (
     <div className='flex flex-col'>
          
          {/* Main Comment */}
          <div className='flex gap-3 py-2'>
               <Avatar
                    username={comment.commenter_name}
                    size='sm'
                    src={comment.commenter_avatar}
               />
               <div className='flex-1'>
                    <div className='text-sm'>
                         <span className='font-semibold text-gray-800'>
                              {comment.commenter_username || 'Anonymous'}
                         </span>{''}
                         <span className='text-gray-700 ml-1'>{comment.content}</span>
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                         <span className='text-xs text-gray-50'>
                              {formatTimeAgo(comment.created_at)}
                         </span>
                         <button
                              className='text-xs text-indigo-600 hover:text-indigo-800'
                              onClick={() => setIsReplying(true)}
                         >
                              Reply
                         </button>
                    </div>
               </div>
          </div>
          {/* Reply input (appears when 'Reply' is clicked) */}
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
     </div>
   );
}