// config/socket.js
import { Server } from 'socket.io';

const userSocketMap = {};
let io; // Declare io at module level

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("call:request", ({ receiverId, callType, callId, caller }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("call:incoming", { callId, caller, callType });
      }
    });

    socket.on("call:accept", ({ callId, callerId, receiver }) => {
      const callerSocketId = userSocketMap[callerId];
      if (callerSocketId) {
        io.to(callerSocketId).emit("call:accepted", { callId, receiver });
      }
    });

    socket.on("call:reject", ({ callId, callerId }) => {
      const callerSocketId = userSocketMap[callerId];
      if (callerSocketId) {
        io.to(callerSocketId).emit("call:rejected", { callId });
      }
    });

    socket.on("call:offer", ({ callId, to, offer }) => {
      const toSocket = userSocketMap[to];
      if (toSocket) {
        io.to(toSocket).emit("call:offer", {
          callId,
          offer,
          from: socket.handshake.query.userId,
        });
      }
    });

    socket.on("call:answer", ({ callId, to, answer }) => {
      const toSocket = userSocketMap[to];
      if (toSocket) {
        io.to(toSocket).emit("call:answer", {
          callId,
          answer,
          from: socket.handshake.query.userId,
        });
      }
    });

    socket.on("call:ice", ({ callId, to, candidate }) => {
      const toSocket = userSocketMap[to];
      if (toSocket) {
        io.to(toSocket).emit("call:ice", {
          callId,
          candidate,
          from: socket.handshake.query.userId,
        });
      }
    });

    socket.on("call:hangup", ({ callId, to }) => {
      const toSocket = userSocketMap[to];
      if (toSocket) {
        io.to(toSocket).emit("call:hangup", {
          callId,
          from: socket.handshake.query.userId,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  io.on("connect_error", (err) => {
    console.error("🔥 Socket connect error:", err.message);
  });
}

export { io };