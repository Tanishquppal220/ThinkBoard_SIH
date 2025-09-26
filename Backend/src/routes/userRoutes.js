import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getAllUserLocations, getUserData, updateProfilePic,getUserContextForAI, } from '../controllers/userController.js';
import upload from '../middleware/upload.js';

const userRoutes = express.Router();

userRoutes.get('/data',userAuth,getUserData);
userRoutes.put("/update-profile-pic",userAuth, upload.single("profilePic"), updateProfilePic);
userRoutes.get('/locations', userAuth ,getAllUserLocations);
userRoutes.get('/context/:userId', userAuth, getUserContextForAI);

export default userRoutes;
