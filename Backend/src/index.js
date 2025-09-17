import express from "express";
import dotenv from "dotenv";
import notesRoutes from "./routes/notesRoutes.js";
import { connectDB } from "./config/db.js";
import ratelimiter from "./middleware/ratelimiter.js";
import cors from 'cors';
import authRoutes from "./routes/authRoutes.js";
import cookieParser from 'cookie-parser';
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import {app,server} from "./config/socket.js";


dotenv.config();
const PORT = process.env.PORT || 5001

app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true
}))

app.use(ratelimiter);

app.use('/api/notes',notesRoutes);
app.use('/api/auth',authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/message',messageRoutes);
connectDB().then(()=>{
    server.listen(PORT,()=>{
    console.log(`Server activated on port ${PORT}`);
})
})
