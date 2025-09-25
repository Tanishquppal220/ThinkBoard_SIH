import express from "express";
import { googleLogin, isAuthenticated, login, logout, register, resetPassword, sendResetOtp, sendverifyOtp, updateLocation, verifyEmail } from "../controllers/authController.js";
import userAuth from "../middleware/userAuth.js";

const authRoutes = express.Router()

authRoutes.post('/register',register);
authRoutes.post('/login',login);
authRoutes.post('/logout',logout);
authRoutes.post('/send-verify-otp',userAuth, sendverifyOtp);
authRoutes.post('/verify-account',userAuth, verifyEmail);
authRoutes.get('/is-auth', userAuth, isAuthenticated);
authRoutes.post('/send-reset-otp',sendResetOtp);
authRoutes.post('/reset-password',resetPassword);
authRoutes.post('/location',userAuth,  updateLocation);
authRoutes.post('/google-login', googleLogin);



export default authRoutes;