import React, { useContext, useEffect, useRef } from 'react'
import ChatHeader from './ChatHeader'
import MessageInput from './MessageInput'
import { AppContent } from '../context/AppContext';
import { userChatStore } from '../store/userChatStore.js';
import { formatMessageTime } from '../lib/utils.js';
import { Trash, Trash2, X } from 'lucide-react';

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    setSelectedUser, // Add this to clear selected user on mobile back
  } = userChatStore();

  const { userData } = useContext(AppContent); // <-- replaces authUser
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle back button for mobile
  const handleBackToSidebar = () => {
    setSelectedUser(null);
  };

  return (
    <div className={`
    flex flex-col flex-1 overflow-y-auto
    md:flex md:relative md:inset-auto md:z-auto
    ${selectedUser ? "absolute inset-0 z-50 bg-base-100" : "hidden md:flex"}
  `}>

        <ChatHeader/>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          // console.log("message:", message);
          // console.log("userData:", userData);
          const senderId =
            message?.senderId?._id || message?.senderId; // handle both object + string cases
          const isOwnMessage = senderId?.toString() === userData?._id?.toString();
          // console.log(senderId);

          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOwnMessage
                        ? userData?.profilePic || "/avatar.png"
                        : selectedUser?.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col relative group py-2">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
                {isOwnMessage && (
                  <button
                    onClick={() => deleteMessage(message._id)}
                    className="absolute top-2 -left-10 opacity-0 group-hover:opacity-100 duration-200 ease-in-out hover:bg-gray-100 rounded-full p-2 text-gray-400 hover:text-gray-600 hover:scale-110 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <MessageInput/>
    </div>
  )
}

export default ChatContainer