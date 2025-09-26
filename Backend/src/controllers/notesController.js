import Note from "../models/notes.js";
import axios from 'axios';


// Helper function to analyze emotions using the Python API
async function analyzeTextEmotion(text) {
	try {
		const response = await axios.post(
			`${process.env.PYTHON_API}/analyze-text-emotion`,
			{
				text: text,
			}
		);
		console.log(response.data);
		return response.data.emotions || [];
	} catch (error) {
		console.error('Error analyzing text emotion:', error.message);
		return []; // Return empty array if analysis fails
	}
}

export async function getAllNotes(req,res) {
    try{
        const notes = await Note.find({ userId : req.userId }).sort({ createdAt: -1 })
        res.status(200).json({success:true,notes});

    } catch(e){
        console.error(e);
        res.status(500).json({success:false,message: "Internal Server Error"});
    }
};

export async function createNote(req,res) {
    try{

        const { title, content} = req.body;
        const newNote = new Note({ title, content, userId: req.userId });
        const savedNote = await newNote.save()
        res.status(201).json({success:true,savedNote});
    } catch(e){
        console.error(e);
        res.status(500).json({success:false,message: "Internal Server Error"});
    }
};

export async function updateNote(req,res){
    try{
        const { title, content } = req.body;
        const updatedNote = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { title, content },
            { new: true }
        );
        if (!updatedNote) return res.status(404).json({success:false, message: "Note not found or unauthorized" });

        res.status(200).json({success:true,updatedNote})

    } catch(e){
        console.error(e);
        res.status(500).json({success:false,message: "Internal Server Error"});
    }
};

export async function deleteNote(req,res){
    try{
        const userId = req.userId; // from middleware
        const noteId = req.params.id; // from frontend request

        const deletedNote = await Note.findOneAndDelete({ _id: noteId, userId });
        if (!deletedNote) {
            return res.status(404).json({success:false, message: "Note not found or unauthorized" });
        }

        res.status(200).json({success:true, message: "Note deleted successfully" });
    } catch(e){
        console.error(e);
        res.status(500).json({success:false,message: "Internal Server Error"});
    }

}

export async function getNoteById(req,res){
    try{
        const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
        if (!note) return res.status(404).json({success:false, message: "Note not found or unauthorized" });
        res.status(200).json({success:true,note});

    } catch(e){
        console.error(e);
        res.status(500).json({success:false,message: "Internal Server Error"});
    }
}