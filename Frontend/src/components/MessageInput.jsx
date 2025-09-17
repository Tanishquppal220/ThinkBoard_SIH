import React, { useRef, useState } from 'react'
import { userChatStore } from '../store/userChatStore';
import toast from 'react-hot-toast';
import { Image, Send, X, Plus } from 'lucide-react';
import { isAxiosError } from 'axios';

const MessageInput = () => {
    const [text,setText] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);
    const {sendMessages} = userChatStore();

    // Common emojis for the picker
    const emojis = [
        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
        '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
        '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
        '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
        '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
        '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
        '👍', '👎', '👏', '🙌', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕',
        '💖', '💗', '💘', '💝', '💟', '💔', '❣️', '💋', '🔥', '⭐'
    ];

    const handleImageChange = (e)=>{
        const file = e.target.files[0];
        if(!file.type.startsWith("image/")){
            toast.error("Please select an image file");
            return;
           }
        setSelectedImage(file); // ✅ keep file for backend
        setImagePreview(URL.createObjectURL(file));
    }

    const removeImage = ()=>{
        setImagePreview(null);
        setSelectedImage(null);
        if(fileInputRef.current){
            fileInputRef.current.value = null;
        }
    }

    const handleEmojiClick = (emoji) => {
        setText(prev => prev + emoji);
        setShowEmojiPicker(false);
    }

    const handleSendMessage = async (e)=>{
        e.preventDefault();
        if(!text.trim() && !imagePreview){
            toast.error("Cannot send empty message");
            return;
        }
        try {
            await sendMessages({
                text: text.trim(),
                image: selectedImage,
            });
            setText('');
            setImagePreview(null);
            setSelectedImage(null);
            if(fileInputRef.current){
                fileInputRef.current.value = null;
            }
        } catch (error) {
                     
        }
    }

    return (
    <div className='p-4 w-full relative'>
        {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 shadow-lg z-10 w-80 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-8 gap-2">
                    {emojis.map((emoji, index) => (
                        <button
                            key={index}
                            type="button"
                            className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                            onClick={() => handleEmojiClick(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        )}

       <form onSubmit={handleSendMessage} className="flex items-center gap-2">
         <div className="flex-1 flex gap-2">
           {/* Plus/Emoji button */}
           <button
             type="button"
             className="btn btn-md btn-circle text-zinc-400 hover:text-zinc-600"
             onClick={() => setShowEmojiPicker(!showEmojiPicker)}
           >
             <Plus className='size-8' />
           </button>

           <input
             type="text"
             className="w-full input input-bordered rounded-lg input-sm sm:input-md"
             placeholder="Type a message..."
             value={text}
             onChange={(e) => setText(e.target.value)}
           />
           <input
             type="file"
             accept="image/*"
             className="hidden"
             ref={fileInputRef}
             onChange={handleImageChange}
           />
           
           <button
             type="button"
             className={`hidden sm:flex btn btn-circle flex-shrink-0                    
             ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
             onClick={() => fileInputRef.current?.click()}
           >
             <Image size={20} />
           </button>
         </div>
         <button
           type="submit"
           className="btn btn-sm btn-circle"
           disabled={!text.trim() && !imagePreview}
         >
           <Send size={22} />
         </button>
       </form>
           </div>
  )
}

export default MessageInput