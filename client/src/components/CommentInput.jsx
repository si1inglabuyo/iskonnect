import { use, useState } from 'react';
import { Button } from './ui/button';
import api from '../lib/api';

export default function CommentInput({ postId, parentId = null, onComment }) {
     const [content, setContent] = useState('');
     const [submitting, setSubmitting] = useState(false);

     const handleSubmit = async (e) => {
          e.preventDefault();
          if (!content.trim()) return;

          setSubmitting(true);
          try {
               await api.post(`/api/comments/${postId}`, {
                    content: content.trim(),
                    parent_comment_id: parentId

               });
               setContent('');
               if (onComment) onComment();
          } catch (err) {
               const msg = err.response?.data?.error || 'Failed to post comment';
               alert(msg);
          } finally {
               setSubmitting(false);
          }
     };

     return (
          <form onSubmit={handleSubmit} className='flex gap-2'>
               <input 
                    type="text" 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder='Write a reply...'
                    className='flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500'
                    autoFocus
               />
               <Button
                    type='submit'
                    size='sm'
                    disabled={!content.trim() || submitting}
                    className='bg-indigo-600 hover:bg-indigo-700 text-white'
               >
                    Post
               </Button>
          </form>
     );
}