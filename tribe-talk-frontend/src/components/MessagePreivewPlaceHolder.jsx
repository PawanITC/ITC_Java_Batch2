import React, { useState } from 'react'
import SelectUser from './SelectUser';

const MessagePreivewPlaceHolder = ({ onSelectUser }) => {
  const [newChatPopup, setNewChatPopUp] = useState(false);

  return (
    <div className="hidden md:flex flex-col items-center justify-center w-full h-full text-yellow-300 border-l border-neutral-800">
      <h2 className="text-2xl font-bold mb-2">Select a chat</h2>
      <p className="text-yellow-500 text-sm max-w-xs text-center">
        Choose from your existing conversations, or start a new one.
      </p>

      {/* New chat button */}
      <button
        onClick={() => setNewChatPopUp(true)}
        className="mt-4 px-4 py-2 rounded-lg border border-yellow-700 text-gray-900 dark:text-yellow-100 bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:bg-neutral-800 transition"
      >
        New Chat
      </button>

      {/* POPUP (just the component — no overlay) */}
      {newChatPopup && (
        <SelectUser
          onClose={() => setNewChatPopUp(false)}
          onUserSelect={(selection) => {
            onSelectUser(selection);
            setNewChatPopUp(false);
          }}
        />
      )}
    </div>
  );
};

export default MessagePreivewPlaceHolder;
