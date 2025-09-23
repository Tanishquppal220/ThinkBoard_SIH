import express from 'express';
import { detectEmotionCamera, detectEmotionForm, detectEmotionVoice, getEmotionHistory } from '../controllers/emotionController.js';
import upload from '../middleware/upload.js';
import userAuth from '../middleware/userAuth.js';

const emotionRoutes = express.Router();

emotionRoutes.post("/camera", detectEmotionCamera);
emotionRoutes.post("/voice", upload.single("file"), detectEmotionVoice);
emotionRoutes.post('/form',detectEmotionForm);
emotionRoutes.get("/history/:userId",  getEmotionHistory);

export default emotionRoutes;

