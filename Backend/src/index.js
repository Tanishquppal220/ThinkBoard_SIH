// src/index.js or backend/index.js
import express from "express";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";

import notesRoutes from "./routes/notesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import ratelimiter from "./middleware/ratelimiter.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";

dotenv.config();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173", // Update for production
  credentials: true,
}));
app.use(ratelimiter);

// Routes
app.use("/api/notes", notesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/message", messageRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("/:wildcard*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Start server after DB connection
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server activated on port ${PORT}`);
  });
});