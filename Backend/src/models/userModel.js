import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type:String, required: true },
    email: {type:String, required:true, unique:true},
    password: {type:String,  default: ""},
    googleId: { type: String, default: null },
    verifyOtp: {type:String, default:''},
    verifyOtpExpireAt: {type:Number, default:0},
    isAccountVerified: {type: Boolean, default: false},
    resetOtp: {type:String, default:''},
    resetOtpExpireAt: {type:Number, default:0},
    profilePic :{type: String, default:""},
    location: {
        type: {
            lat: {type: Number, default: null},
            lng: {type: Number, default: null},
        }
    },
      emotionHistory: [
  {
    emotion: String,
    source: String, 
    phq9_score: { type: Number, default: null },
    gad7_score: { type: Number, default: null },
    timestamp: { type: Date, default: Date.now }
  }
],
spotify: {
    accessToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
    expiresAt: { type: Number, default: 0 },
    connectedAt: { type: Date, default: null }
  }


});

const userModel = mongoose.models.user || mongoose.model("user",userSchema);

export default userModel;