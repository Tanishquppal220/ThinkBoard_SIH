import express from 'express';
import { deleteMessage, getMessages, getUsersForSidebar, sendMessages } from '../controllers/messageController.js';
import userAuth from '../middleware/userAuth.js';
import upload from '../middleware/upload.js';

const router = express.Router()

router.get('/users',getUsersForSidebar);
router.get('/:id',userAuth, getMessages);

router.post('/send/:id',userAuth,upload.single("image"), sendMessages);
router.delete('/:messageId',userAuth, deleteMessage);

export default router

