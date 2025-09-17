import { X } from "lucide-react";
import { userChatStore } from "../store/userChatStore.js";
import { Phone, Video } from "lucide-react";
import { useContext } from "react";
import { AppContent } from "../context/AppContext.jsx";
import { useSocketStore } from "../store/useSocketStore.js";
import { useNavigate } from "react-router";
import { v4 as uuidv4 } from "uuid";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = userChatStore();
  const { userData } = useContext(AppContent);
  const { socket } = useSocketStore();
  const navigate = useNavigate();

  const startCall = (type) =>{

    if (!selectedUser) return;
    const callId = uuidv4();
    socket?.emit("call:request",{
      receiverId: selectedUser._id,
      callType: type,
      callId,
      caller: {
        _id: userData._id,
        name: userData.name,
        profilePic: userData.profilePic,
      }
    });
    navigate(`/call/${callId}`, {state: {callId, isCaller:true, peerId: selectedUser._id, callType: type}});
  };




  if (!selectedUser) return null;

  return (
    <div className="sticky top-0 z-20 bg-base-100 border-b border-base-300 p-3">
      <div className="flex items-center justify-between">
        
        {/* Left: Avatar + Name */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {selectedUser.profilePic ? (
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-base-300/50">
                <img
                  src={selectedUser.profilePic}
                  alt={selectedUser.fullName || selectedUser.name}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-semibold text-primary border border-primary/20">
                {selectedUser.fullName
                  ? selectedUser.fullName[0].toUpperCase()
                  : selectedUser.name
                  ? selectedUser.name[0].toUpperCase()
                  : "U"}
              </div>
            )}
          </div>

          {/* User info */}
          <div >
            <h3 className="font-medium text-base-content">
              {selectedUser.fullName || selectedUser.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center">

        {/* Close button (only visible on small screens) */}
          <button className="btn btn-ghost" onClick={()=>startCall("audio")}>
            <Phone className="size-4"/>
          </button>
          <button className="btn btn-ghost" onClick={()=>startCall("video")}>
            
            <Video className="size-5"/>

          </button>
          </div>
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 rounded-full hover:bg-base-300 transition-colors"
          >
            <X className="w-5 h-5 text-base-content" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
