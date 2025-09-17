import React from "react";
import Navbar from "../components/Navbar";
import UsersSideBar from "../components/UsersSideBar";
import ChatContainer from "../components/ChatContainer";
import { userChatStore } from "../store/userChatStore";
import { MessageSquare } from "lucide-react";
import NoChatSelected from "../components/NoChatSelected";

const ChatHomePage = () => {
  const { selectedUser } = userChatStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-300/50 to-base-200">
      <Navbar />
      <div className="flex items-center justify-center pt-20 px-4 h-screen">
        <div className="bg-base-100 rounded-2xl shadow-2xl w-full h-full max-h-[calc(100vh-8rem)] border border-base-300/50 backdrop-blur-sm">
          <div className="flex h-full rounded-2xl overflow-hidden shadow-inner">
            {/* Sidebar */}
            <UsersSideBar />

            {/* Chat area */}
            {selectedUser ? (
              <ChatContainer />
            ) : (
              <NoChatSelected/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHomePage;
