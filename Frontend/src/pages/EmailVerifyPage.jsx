import React, {useEffect, useState} from 'react'
import axios from 'axios';
import { AppContent } from '../context/AppContext';
import { useContext } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { Mail, Shield,LoaderIcon } from 'lucide-react';

const EmailVerifyPage = () => {
    axios.defaults.withCredentials = true;
    const {backendUrl, isLoggedin, userData, getUserData} = useContext(AppContent);

    const navigate = useNavigate();
    const [loading,setLoading] = useState(false)

    const inputRefs = React.useRef([])
    const handleInput = (e,index)=>{
        if(e.target.value.length>0 && index<inputRefs.current.length-1){
            inputRefs.current[index+1].focus()
        }
    }

    const handleKeyDown = (e,index)=>{
        if(e.key === "Backspace" && e.target.value===''&& index>0){
            inputRefs.current[index-1].focus();
        }
    }

    const handlePaste = (e)=>{
        const paste = e.clipboardData.getData('text');
        const pasteArray = paste.split('');
        pasteArray.forEach((char,index) => {
            if(inputRefs.current[index]){
                inputRefs.current[index].value = char
            }
        });
    }

    const onSubmithandler = async (e) =>{
        e.preventDefault();
        setLoading(true);
        try {
            const otpArray = inputRefs.current.map(e=>e.value);
            const otp = otpArray.join('');
            const {data} = await axios.post(backendUrl + '/api/auth/verify-account', {otp,userId: userData._id});
            if (data.success){
                toast.success(data.message);
                getUserData();
                navigate('/');   
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);   
        } finally{
            setLoading(false);
        }
    }

    useEffect(() => {
    isLoggedin && userData && userData.isAccountVerified && navigate('/')
  }, [isLoggedin, userData])


  // Import at the top of your file:
// import { Mail, Shield } from 'lucide-react'

return (
  <div className='min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center px-6'>
    {/* Home/Logo Button */}
    <button 
      onClick={() => navigate('/')} 
      className='btn btn-ghost btn-circle absolute left-5 sm:left-20 top-5 hover:scale-110 transition-transform duration-300'
    >
      <div className='w-28 sm:w-32 text-primary font-bold text-xl'>
        ThinkBoard
      </div>
    </button>

 
    <div className='card w-full max-w-md bg-base-300 shadow-2xl animate-in fade-in duration-500'>
      <div className='card-body'>
        <form onSubmit={onSubmithandler} className='space-y-6'>

          <div className='text-center space-y-3'>
            <div className='w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4'>
              <Mail className='w-8 h-8 text-primary' />
            </div>
            <h1 className='text-3xl font-bold text-base-content'>
              Email Verification
            </h1>
            <p className='text-base-content/70 text-sm'>
              Enter the 6-digit code sent to your email address
            </p>
          </div>

          <div 
            className='flex justify-center gap-3 mb-8' 
            onPaste={handlePaste}
          >
            {Array(6).fill(0).map((_, index) => (
              <input 
                type="text" 
                maxLength='1' 
                key={index} 
                required
                className='input input-bordered w-14 h-14 text-center text-2xl font-bold focus:input-primary focus:scale-105 transition-all duration-200 bg-base-200'
                ref={e => inputRefs.current[index] = e}
                onInput={(e) => handleInput(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button 
            type="submit"
            className='btn btn-primary w-full text-lg font-medium hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-primary to-secondary border-none' disabled={loading}
          >
            <Shield className='size-5' />
            {loading ? <LoaderIcon className="animate-spin size-3 text-primary" /> : 'Verify Account'}
          </button>

          {/* Resend Code */}
          {/* <div className='text-center mt-6'>
            <p className='text-base-content/70 text-sm mb-2'>
              Didn't receive the code?
            </p>
            <button 
              type="button"
              className='link link-primary font-medium hover:link-hover'
            >
              Resend Code
            </button>
          </div> */}
        </form>
      </div>
    </div>
  </div>
)
}

export default EmailVerifyPage
