import cloudinary from "../config/cloudinary.js";
import { getReceiverSocketId, io } from "../config/socket.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js"


export const getUsersForSidebar = async (req,res)=>{
    try {
        const loggedInUserId = req.userId;
        const filteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password");
        res.status(200).json({success:true, filteredUsers});
    } catch (error) {
        console.error(error);
        res.status(500).json({success:false, message:"Internal Server Error"})
        
    }
};

export const getMessages = async(req,res) =>{
    try {
        const {id: userToChatId} = req.params
        const myId = req.userId

        const messages = await Message.find({
            $or:[
                {senderId: myId , receiverId: userToChatId},
                {senderId: userToChatId , receiverId: myId}
            ],

        });
        res.status(200).json({success:true, messages});
    } catch (error) {
        console.error(error);
        res.status(500).json({success:false, message:"Internal Server Error"})
        
    }
};

export const sendMessages = async(req,res) =>{
    try {
        const {text,image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.userId;

        let imageUrl;
        // if (image){
        //     const uploadResponse = await cloudinary.uploader.upload(image);
        //     imageUrl = uploadResponse.secure_url;
        // }
        if (req.file){
            imageUrl = req.file.path || req.file.secure_url;
        }
        // console.log(receiverId);

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        await newMessage.save();

        // const receiverSocketId = getReceiverSocketId(receiverId);
        // if (receiverSocketId) {
        //     io.to(receiverSocketId).emit("newMessage", newMessage);
            
        // }
        // Send to receiver if online
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json({success:true, newMessage});


    } catch (error) {
        console.error(error);
        res.status(500).json({success:false, message:"Internal Server Error"});
        
    }
}

export const deleteMessage = async(req,res)=>{
    try {
        const {messageId} = req.params;
        const userId = req.userId;

        const message = await Message.findById(messageId);
        if (!message){
            return res.status(404).json({success:false, message:"Message not found"});
        }
        if (message.senderId.toString() !== userId.toString()){
            return res.status(403).json({success:false, message:"Not authorized"});
        }


        await Message.deleteOne({ _id: messageId });

        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        if (receiverSocketId){
            io.to(receiverSocketId).emit("messageDeleted",{ messageId });
        }
        io.to(userId.toString()).emit("messageDeleted",{ messageId });
        res.status(200).json({success:true, messageId});

        
    } catch (error) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
        
    }
}
