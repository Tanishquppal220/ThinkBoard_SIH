import { ArrowLeftIcon,Brain } from 'lucide-react'
import React, { useState,useEffect ,useCallback} from 'react'
import toast from 'react-hot-toast'
import { Link,  useNavigate } from 'react-router'
import api from '../lib/axios'
import EmotionBadges from '../components/EmotionBadges.jsx';


const CreatePage = () => {
  const [title,setTitle] = useState('')
  const [content,setContent]  = useState('')
  const [loading,setLoading] = useState(false)
  const [previewEmotions, setPreviewEmotions] = useState([]);
  const [analyzingEmotions, setAnalyzingEmotions] = useState(false)
  const navigate = useNavigate()

  // Debounced emotion analysis
	const analyzeEmotions = useCallback(async (text) => {
		if (!text.trim()) {
			setPreviewEmotions([]);
			return;
		}

		setAnalyzingEmotions(true);
		try {
			const response = await fetch(
				'http://127.0.0.1:8000/analyze-text-emotion',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ text }),
				}
			);

			if (response.ok) {
				const data = await response.json();
				setPreviewEmotions(data.predicted_emotions || []);
			} else {
				setPreviewEmotions([]);
			}
		} catch (error) {
			console.log('Emotion analysis failed:', error);
			setPreviewEmotions([]);
		} finally {
			setAnalyzingEmotions(false);
		}
	}, []);

	// Debounce emotion analysis
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (content.length > 10) {
				// Only analyze if content has meaningful length
				analyzeEmotions(content);
			} else {
				setPreviewEmotions([]);
			}
		}, 1000); // Wait 1 second after user stops typing

		return () => clearTimeout(timeoutId);
	}, [content, analyzeEmotions]);
  const handleSubmit = async (e)=>{
    e.preventDefault()

    if(!title || !content){
      toast.error("All fields are required");
      return
    }

    setLoading(true)
    try{
      await api.post('/api/notes',{
        title,
        content
      })
      toast.success("Note Created Successfully!");
      navigate('/')

    } catch(e){
      console.log("Failed creating notes",e)
      if(e.respone.status === 249){
        toast.error("Slow down! You are creating notes too fast.",{
          duration: 4000,
          icon: "☠️"
        })
      }else{
      toast.error("Failed to create note");
      }

    } finally{
      setLoading(false)

    }


  }
  return (
    
    <div className='min-h-screen bg-base-200 '>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto'>
          <Link to = {'/'} className='btn btn-ghost mb-6'>
          <ArrowLeftIcon className='size-5'/>
          Back to notes
          </Link>

          <div className='card bg-base-100'>
            <div className='card-body'>
              <h2 className='card-title text-2xl mb-4'>Create new Note</h2>
              <form onSubmit={handleSubmit}>
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>Title</span>
                  </label>
                  <input type="text"
                  placeholder='Note Title'
                  className='input input-bordered'
                  value = {title}
                  onChange={(e)=>setTitle(e.target.value)}
                  
                  />

                </div>
                <div className='form-control mb-4'>
                  <label className='label'>
                    <span className='label-text'>Content</span>
                  </label>
                  <textarea type="text"
                  placeholder='Note Content'
                  className='textarea textarea-bordered h-32'
                  value = {content}
                  onChange={(e)=>setContent(e.target.value)}
                  
                  />

                </div>
                {/* Emotion Preview */}
								{(content.length > 10 || previewEmotions.length > 0) && (
									<div className='form-control mb-4'>
										<label className='label'>
											<span className='label-text flex items-center gap-2'>
												<Brain className='w-4 h-4' />
												Emotion Preview
												{analyzingEmotions && (
													<span className='loading loading-spinner loading-xs'></span>
												)}
											</span>
										</label>
										<div className='bg-base-200 rounded-lg p-3 min-h-[3rem] flex items-center'>
											{analyzingEmotions ? (
												<div className='flex items-center gap-2 text-base-content/60'>
													<span className='loading loading-spinner loading-sm'></span>
													<span>Analyzing emotions...</span>
												</div>
											) : previewEmotions.length > 0 ? (
												<EmotionBadges
													emotions={previewEmotions}
													maxDisplay={6}
												/>
											) : content.length > 10 ? (
												<span className='text-base-content/60'>
													No specific emotions detected
												</span>
											) : (
												<span className='text-base-content/40'>
													Type more content to see emotion analysis
												</span>
											)}
										</div>
									</div>
								)}

                <div className='card-actions justify-end'>
                  <button type = "submit" className='btn btn-primary' disabled={loading}>
                    {loading ? "Creating...": "Create Note"}
                  </button>
                </div>
              </form>


            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CreatePage
