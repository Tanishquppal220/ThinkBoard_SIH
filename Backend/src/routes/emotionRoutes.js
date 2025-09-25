import express from 'express';
import { detectEmotionCamera, detectEmotionForm, detectEmotionVoice, getAvailableGenres, getEmotionHistory, getSpotifyRecommendations, getSpotifyToken, searchSpotifyTracks } from '../controllers/emotionController.js';
import upload from '../middleware/upload.js';
import userAuth from '../middleware/userAuth.js';

const emotionRoutes = express.Router();

emotionRoutes.post("/camera", detectEmotionCamera);
emotionRoutes.post("/voice", upload.single("file"), detectEmotionVoice);
emotionRoutes.post('/form',detectEmotionForm);
emotionRoutes.get("/history/:userId",  getEmotionHistory);
emotionRoutes.get('/spotify-token',getSpotifyToken);
emotionRoutes.get('/spotify-search', searchSpotifyTracks);
emotionRoutes.get('/spotify-recommendations', getSpotifyRecommendations);
emotionRoutes.get('/spotify-genres', getAvailableGenres);

export default emotionRoutes;

