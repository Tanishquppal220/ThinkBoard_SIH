import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getAllUserLocations, getUserData, updateProfilePic } from '../controllers/userController.js';
import upload from '../middleware/upload.js';

const userRoutes = express.Router();

userRoutes.get('/data',userAuth,getUserData);
userRoutes.put("/update-profile-pic",userAuth, upload.single("profilePic"), updateProfilePic);
userRoutes.get('/locations', userAuth ,getAllUserLocations);

export default userRoutes;
