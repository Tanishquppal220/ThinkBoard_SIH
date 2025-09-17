import React, { useEffect, useRef, useState, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useSocketStore } from "../store/useSocketStore";
import { useCallStore } from "../store/useCallStore";
import { AppContent } from "../context/AppContext";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  PhoneCall,
  User,
  Loader2
} from "lucide-react";

const ICE_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const CallPage = () => {
  const { callId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { userData } = useContext(AppContent);
  const { socket } = useSocketStore();
  const { setActiveCall, clearActiveCall, setIncomingCall, clearIncomingCall, incomingCall } = useCallStore();

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const micAnalyzeRef = useRef(null);

  const [isCaller, setIsCaller] = useState(location.state?.isCaller || false);
  const [peerId, setPeerId] = useState(location.state?.peerId || null);
  const [callType, setCallType] = useState(location.state?.callType || "audio");

  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [callStatus, setCallStatus] = useState("connecting"); // connecting, ringing, connected
  const [callDuration, setCallDuration] = useState(0);

  /** -------------------- Helper functions -------------------- **/

  // Initialize local media stream
  const ensureLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const constraints =
        callType === "video"
          ? { audio: true, video: { width: 640, height: 480 } }
          : { audio: true, video: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // mic analyzer
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      micAnalyzeRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMicLevel = () => {
        if (!micAnalyzeRef.current) return;
        micAnalyzeRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a,b) => a+b, 0);
        const level = Math.min(sum / (dataArray.length * 256), 1);
        setMicLevel(level);
        requestAnimationFrame(updateMicLevel);
      };

      updateMicLevel();

      return stream;
    } catch (err) {
      console.error("getUserMedia error", err);
      throw err;
    }
  };

  // Create peer connection
  const createPeerConnection = async () => {
    if (pcRef.current) return;
    pcRef.current = new RTCPeerConnection(ICE_CONFIG);

    // attach local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pcRef.current.addTrack(t, localStreamRef.current));
    }

    // setup remote stream
    remoteStreamRef.current = new MediaStream();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;

    pcRef.current.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      event.streams[0].getTracks().forEach((t) => remoteStreamRef.current.addTrack(t));
    };

    pcRef.current.onicecandidate = (evt) => {
      if (evt.candidate && peerId) {
        socket.emit("call:ice", { callId, to: peerId, from: userData._id, candidate: evt.candidate });
      }
    };

    pcRef.current.onconnectionstatechange = () => {
      if (pcRef.current.connectionState === "connected") {
        setCallStatus("connected");
      } else if (pcRef.current.connectionState === "disconnected" || pcRef.current.connectionState === "closed") {
        closeCall();
      }
    };
  };

  const startCall = async () => {
    setIsConnecting(true);
    await ensureLocalStream();
    await createPeerConnection();

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socket.emit("call:offer", { callId, to: peerId, from: userData._id, offer });
    setActiveCall({ callId, peerId, callType });
    setIsConnecting(false);
  };

  const closeCall = () => {
    try {
      // Close peer connection
      pcRef.current?.close();
      pcRef.current = null;

      // Stop local tracks (camera + mic)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      // Clear remote stream
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current = null;
      }

      // Reset refs for video elements
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    } catch (e) {
      console.warn("Error closing call", e);
    }

    // Clear call state in store
    clearActiveCall();
  };

  /** -------------------- Call actions -------------------- **/

  const acceptCall = async () => {
    if (!peerId) return;
    setIsAccepting(true);
    socket.emit("call:accept", {
      callId,
      callerId: peerId,
      receiverId: userData._id,
      receiver: { _id: userData._id, name: userData.name },
    });
    setActiveCall({ callId, peerId, callType });
    clearIncomingCall();
    setIsAccepting(false);
  };

  const rejectCall = () => {
    socket.emit("call:reject", { callId, callerId: peerId });
    clearIncomingCall();
    navigate(-1);
  };

  const hangUp = () => {
    socket.emit("call:hangup", { callId, to: peerId });
    closeCall();
    navigate(-1);
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMuted(!muted);
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCamOff(!camOff);
  };

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /** -------------------- Effects -------------------- **/

  // Call duration timer
  useEffect(() => {
    let interval;
    if (callStatus === "connected") {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Initialize local stream immediately
  useEffect(() => {
    ensureLocalStream();
  }, []);

  // Caller emits call:request on mount
  useEffect(() => {
    if (isCaller && peerId && userData && socket) {
      console.log("🚀 Sending call request to", peerId);
      setCallStatus("ringing");
      socket.emit("call:request", {
        receiverId: peerId,
        callType,
        callId,
        caller: { _id: userData._id, name: userData.name },
      });
    }
  }, [isCaller, peerId, userData, callId, callType, socket]);

  // Handle incoming socket events
  useEffect(() => {
    if (!socket) return;

    const onIncoming = (payload) => {
      if (payload.callId !== callId) return;
      setIncomingCall(payload);
      setPeerId(payload.caller._id);
      setCallType(payload.callType);
      setCallStatus("ringing");
    };

    const onAccepted = (payload) => {
      if (payload.callId !== callId) return;
      startCall();
    };

    const onOffer = async ({ callId: cid, offer, from }) => {
      if (cid !== callId) return;
      await ensureLocalStream();
      await createPeerConnection();
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("call:answer", { callId, to: from, from: userData._id, answer });
    };

    const onAnswer = async ({ callId: cid, answer }) => {
      if (cid !== callId) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIce = async ({ callId: cid, candidate }) => {
      if (cid !== callId) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Failed to add ICE", err);
      }
    };

    const onHangup = ({ callId: cid }) => {
      if (cid !== callId) return;
      closeCall();
      navigate(-1);
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice", onIce);
    socket.on("call:hangup", onHangup);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice", onIce);
      socket.off("call:hangup", onHangup);
    };
  }, [socket, callId, userData]);

  /** -------------------- JSX -------------------- **/

  const isSpeaking = micLevel > 0.1;

  return (
    <div className="h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-100 flex flex-col p-4">
      {/* Compact Status Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm">
          {callType === "video" ? <Video size={16} /> : <Phone size={16} />}
          <span className="capitalize font-medium">{callType}</span>
          {callStatus === "connected" && (
            <>
              <span>•</span>
              <span>{formatDuration(callDuration)}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isConnecting && <Loader2 className="animate-spin" size={16} />}
          <span className="text-xs badge badge-outline">
            {callStatus === "connecting" && "Connecting..."}
            {callStatus === "ringing" && (isCaller ? "Ringing..." : "Incoming Call")}
            {callStatus === "connected" && "Connected"}
          </span>
        </div>
      </div>

      {/* Video Container - Takes most of the screen */}
      <div className="flex-1 relative bg-base-100 rounded-2xl shadow-2xl overflow-hidden">
        {callType === "video" ? (
          <div className="h-full lg:grid lg:grid-cols-2">
            {/* Remote Video - Full screen on mobile, left side on desktop */}
            <div className="relative bg-neutral h-full lg:h-full">
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-4 left-4">
                <div className="badge badge-neutral">Remote</div>
              </div>
              {!remoteStreamRef.current?.getVideoTracks()[0]?.enabled && (
                <div className="absolute inset-0 bg-neutral flex items-center justify-center">
                  <div className="text-center">
                    <div className="avatar placeholder mb-2">
                      <div className="bg-neutral-focus text-neutral-content rounded-full w-20">
                        <User size={40} />
                      </div>
                    </div>
                    <p className="text-neutral-content">Camera is off</p>
                  </div>
                </div>
              )}
            </div>

            {/* Local Video - PiP on mobile, right side on desktop */}
            <div className="absolute top-4 right-4 w-32 h-48 lg:relative lg:top-0 lg:right-0 lg:w-full lg:h-full bg-base-300 rounded-lg lg:rounded-none overflow-hidden shadow-lg lg:shadow-none z-10">
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-2 left-2 lg:top-4 lg:left-4">
                <div className="badge badge-primary badge-sm lg:badge-md">You</div>
              </div>
              {camOff && (
                <div className="absolute inset-0 bg-base-300 flex items-center justify-center">
                  <div className="text-center">
                    <div className="avatar placeholder mb-1 lg:mb-2">
                      <div className="bg-base-content text-base-100 rounded-full w-8 lg:w-20">
                        <User size={16} className="lg:hidden" />
                        <User size={40} className="hidden lg:block" />
                      </div>
                    </div>
                    <p className="text-base-content text-xs lg:text-base">Camera is off</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Audio Only View */
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="text-center">
              <div className="avatar placeholder mb-4">
                <div className="bg-primary text-primary-content rounded-full w-24">
                  <User size={48} />
                </div>
              </div>
              <p className="text-base-content/70">
                {callStatus === "connected" ? "Call in progress" : "Connecting..."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls - Fixed height */}
      <div className="mt-4 pb-2">
        {/* Mic Level Indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-3 bg-base-100 rounded-full px-4 py-2 shadow-lg">
            <div className={`relative ${isSpeaking ? 'animate-pulse' : ''}`}>
              {muted ? (
                <MicOff size={18} className="text-error" />
              ) : (
                <Mic size={18} className={isSpeaking ? "text-success" : "text-base-content"} />
              )}
              {isSpeaking && !muted && (
                <div className="absolute -inset-2 bg-success/20 rounded-full animate-ping" />
              )}
            </div>
            <div className="w-20 bg-base-300 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-100 ${
                  isSpeaking ? 'bg-success' : 'bg-base-content/30'
                }`}
                style={{ width: `${Math.min(micLevel * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Mute Button */}
          <button 
            onClick={toggleMute}
            className={`btn btn-circle btn-lg ${muted ? 'btn-error' : 'btn-neutral'}`}
          >
            {muted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* Camera Button */}
          {callType === "video" && (
            <button 
              onClick={toggleCamera}
              className={`btn btn-circle btn-lg ${camOff ? 'btn-error' : 'btn-neutral'}`}
            >
              {camOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          )}

          {/* Accept/Decline Buttons for Incoming Calls */}
          {!isCaller && callStatus === "ringing" && (
            <>
              <button 
                onClick={acceptCall}
                disabled={isAccepting}
                className="btn btn-circle btn-lg btn-success"
              >
                {isAccepting ? <Loader2 className="animate-spin" size={24} /> : <PhoneCall size={24} />}
              </button>
              <button 
                onClick={rejectCall}
                className="btn btn-circle btn-lg btn-error"
              >
                <PhoneOff size={24} />
              </button>
            </>
          )}

          {/* Hang Up Button */}
          {(isCaller || callStatus === "connected") && (
            <button 
              onClick={hangUp}
              className="btn btn-circle btn-lg btn-error"
            >
              <PhoneOff size={24} />
            </button>
          )}
        </div>

        {/* Connection Status */}
        {isConnecting && (
          <div className="text-center mt-2">
            <div className="flex items-center justify-center gap-2 text-base-content/70 text-sm">
              <Loader2 className="animate-spin" size={14} />
              <span>Establishing connection...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallPage;