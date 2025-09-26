import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import RateLimitedUI from '../components/RateLimitedUI'

import toast from 'react-hot-toast'
import NoteCard from '../components/NoteCard'
import NotesNotFound from '../components/NotesNotFound'
import { LoaderIcon } from 'lucide-react'
import api from '../lib/axios'

const NoteHomePage = () => {
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)   // ✅ was wrong before (isLoading)

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get('/api/notes')

        if (res.data.success) {
          setNotes(res.data.notes)    // ✅ expect {success, notes: [...]}
          setIsRateLimited(false)
        } else {
          toast.error(res.data.message)
        }
      } catch (e) {
        console.error("Error fetching notes:", e)
        if (e.response?.status === 429) {
          setIsRateLimited(true)
        }
        toast.error("Error fetching notes")
      } finally {
        setLoading(false)   // ✅ correct setter
      }
    }

    fetchNotes()
  }, [])

  return (
    <div className="min-h-screen pt-28">
      <Navbar />

      {isRateLimited && <RateLimitedUI />}

      {loading && (
        <div className="min-h-screen bg-base-200 flex items-center justify-center">
          <LoaderIcon className="animate-spin size-10 text-primary" />
        </div>
      )}

      {!loading && notes.length === 0 && !isRateLimited && <NotesNotFound />}

      {notes.length > 0 && !isRateLimited && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-10">
          {notes.map((note) => (
            <NoteCard key={note._id} note={note} setNotes={setNotes} />
          ))}
        </div>
      )}
    </div>
  )
}

export default NoteHomePage;
