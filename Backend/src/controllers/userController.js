import userModel from "../models/userModel.js"


export const getUserData = async (req,res)=>{
    try {
        const user = await userModel.findById(req.userId);
        if (!user){
            return res.json({success:false, message: "User not found"});
        }

        return res.json({success:true,
            userData:{
                _id: user._id,
                name:user.name,
                profilePic: user.profilePic,
                isAccountVerified: user.isAccountVerified
            }
        })
    } catch (error) {
        return res.json({success:false, message:error.message});
        
    }
}

export const updateProfilePic = async (req,res)=>{
    console.log("req.file:", req.file); 
    console.log("req.body:", req.body);
    try{
        const updatedUser = await userModel.findByIdAndUpdate(
            req.userId,
            {profilePic: req.file.path || req.file.secure_url},
            {new:true}
        );
        res.json({success: true, profilePic: updatedUser?.profilePic, user: updatedUser});
    } catch (error){
        return res.json({success:false, message:error.message});
    }
}

export const getAllUserLocations = async (req,res) =>{
    try {
        const users = await userModel.find({},"name profilePic location");

        res.json({
            success: true,
            users,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        
    }
}

// Get user context for AI interactions
export const getUserContextForAI = async (req, res) => {
	try {
		const { userId } = req.params;

		if (!userId) {
			return res.json({ success: false, message: 'User ID is required' });
		}

		// Get user data with emotion history
		const user = await userModel
			.findById(userId)
			.select('name emotionHistory location');

		if (!user) {
			return res.json({ success: false, message: 'User not found' });
		}

		// Get recent notes from Notes model
		const Note = (await import('../models/notes.js')).default;
		const recentNotes = await Note.find({ userId })
			.sort({ createdAt: -1 })
			.limit(5)
			.select('title content emotions createdAt');

		// Prepare context object
		const userContext = {
			name: user.name,
			emotionHistory: user.emotionHistory || [],
			recentNotes: recentNotes || [],
			location: user.location || null,
		};

		return res.json({
			success: true,
			userContext,
		});
	} catch (error) {
		console.error('Error getting user context for AI:', error);
		return res.json({ success: false, message: error.message });
	}
};
