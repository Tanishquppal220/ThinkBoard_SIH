import express from "express";
import { createNote, deleteNote, getAllNotes, getNoteById, updateNote } from "../controllers/notesController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.get('/',userAuth, getAllNotes);
router.get('/:id',userAuth, getNoteById);
router.post('/',userAuth, createNote);
router.put('/:id',userAuth, updateNote);
router.delete('/:id',userAuth, deleteNote);

export default router;