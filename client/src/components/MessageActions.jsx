import { useRef, useEffect } from 'react';

export default function MessageActions({ isOwn, messageId, onReply, onDelete, position }) {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        // Will not close if clicking on the message itself
        if (!e.target.closest('.message-container')) {
          menuRef.current = null;
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={menuRef}
      className="absolute bg-gray-700 text-white rounded-lg shadow-lg py-2 z-20"
      style={{
        top: position?.top || '0',
        left: position?.left || '0',
        right: position?.right || 'auto',
        minWidth: '120px'
      }}
    >
      {/* Reply Button */}
      <button
        onClick={() => {
          onReply(messageId);
        }}
        className="w-full text-left px-4 py-2 hover:bg-gray-600 flex items-center gap-2 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
     </svg>

        Reply
      </button>

      {/* Delete Button - Only for own messages */}
      {isOwn && (
        <button
          onClick={() => {
            onDelete(messageId);
          }}
          className="w-full text-left px-4 py-2 hover:bg-red-600 flex items-center gap-2 text-sm text-red-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      )}
    </div>
  );
}
