import React, { useState, useEffect } from "react";
import { useCallStore } from "../store/useCallStore";
import { useNavigate } from "react-router";
import { useSocketStore } from "../store/useSocketStore";
import { 
  Phone, 
  PhoneOff, 
  Video, 
  User, 
  Loader2,
  PhoneCall
} from "lucide-react";

const IncomingCall = () => {
  const { incomingCall, clearIncomingCall, setActiveCall } = useCallStore();
  const { socket } = useSocketStore();
  const navigate = useNavigate();
  
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Animation effect when call appears
  useEffect(() => {
    if (incomingCall) {
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  const acceptCall = async () => {
    setIsAccepting(true);
    try {
      socket.emit("call:accept", {
        callId: incomingCall.callId,
        callerId: incomingCall.caller._id,
        receiverId: incomingCall.caller?._id,
      });
      setActiveCall({
        callId: incomingCall.callId,
        peerId: incomingCall.caller._id,
        callType: incomingCall.callType,
      });
      clearIncomingCall();
      navigate(`/call/${incomingCall.callId}`, {
        state: {
          isCaller: false,
          peerId: incomingCall.caller._id,
          callType: incomingCall.callType,
        },
      });
    } catch (error) {
      console.error("Error accepting call:", error);
      setIsAccepting(false);
    }
  };

  const declineCall = async () => {
    setIsDeclining(true);
    try {
      socket.emit("call:reject", {
        callId: incomingCall.callId,
        callerId: incomingCall.caller._id,
      });
      
      // Small delay for better UX
      setTimeout(() => {
        clearIncomingCall();
        setIsDeclining(false);
      }, 500);
    } catch (error) {
      console.error("Error declining call:", error);
      setIsDeclining(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      
      {/* Incoming Call Modal */}
      <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="bg-base-100 rounded-2xl shadow-2xl p-6 w-80 border border-base-300">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-16 animate-pulse">
                    <User size={32} />
                  </div>
                </div>
                {/* Pulsing ring animation */}
                <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-base-content mb-1">
              {incomingCall.caller.name}
            </h3>
            
            <div className="flex items-center justify-center gap-2 text-base-content/70">
              {incomingCall.callType === "video" ? (
                <Video size={16} className="text-primary" />
              ) : (
                <Phone size={16} className="text-primary" />
              )}
              <span className="text-sm capitalize font-medium">
                {incomingCall.callType} Call
              </span>
            </div>
            
            {/* Incoming call indicator */}
            <div className="mt-3">
              <div className="badge badge-primary badge-sm animate-pulse">
                Incoming Call
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {/* Decline Button */}
            <button 
              onClick={declineCall}
              disabled={isDeclining || isAccepting}
              className="btn btn-circle btn-lg btn-error hover:scale-110 transition-transform"
            >
              {isDeclining ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <PhoneOff size={24} />
              )}
            </button>

            {/* Accept Button */}
            <button 
              onClick={acceptCall}
              disabled={isAccepting || isDeclining}
              className="btn btn-circle btn-lg btn-success hover:scale-110 transition-transform animate-pulse"
            >
              {isAccepting ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <PhoneCall size={24} />
              )}
            </button>
          </div>

          {/* Action Labels */}
          <div className="flex justify-center gap-4 mt-3">
            <span className="text-xs text-base-content/60 text-center w-16">
              {isDeclining ? "Declining..." : "Decline"}
            </span>
            <span className="text-xs text-base-content/60 text-center w-16">
              {isAccepting ? "Accepting..." : "Accept"}
            </span>
          </div>

          {/* Connection info */}
          <div className="text-center mt-4 pt-4 border-t border-base-300">
            <p className="text-xs text-base-content/50">
              Call ID: {incomingCall.callId.slice(-6)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default IncomingCall;