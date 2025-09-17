import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'
import { AppContent } from '../context/AppContext'
import toast from 'react-hot-toast'
import { Home, Mail, Lock, Shield, KeyRound, ArrowLeft, LoaderIcon } from 'lucide-react'

const ResetPasswordPage = () => {

  const [codeLoading, setCodeLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const {backendUrl} = useContext(AppContent)
  axios.defaults.withCredentials = true

  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isEmailSent, setIsEmailSent] = useState('')
  const [otp, setOtp] = useState(0)
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false)

  const inputRefs = React.useRef([])
    const handleInput = (e, index) => {
      if(e.target.value.length > 0 && index < inputRefs.current.length - 1){
        inputRefs.current[index + 1].focus()
      }
    }
    
    const handleKeyDown = (e, index) => {
      if(e.key === 'Backspace' && e.target.value === '' && index > 0){
        inputRefs.current[index - 1].focus()
      }
    }
  
    const handlePaste = (e) => {
      const paste = e.clipboardData.getData('text')
      const pasteArray = paste.split('');
      pasteArray.forEach((char, index) => {
        if(inputRefs.current[index]){
          inputRefs.current[index].value = char
        }
      })
    }

    const onSubmitEmail = async (e) => {
      e.preventDefault()
      setCodeLoading(true);
      try {
        const {data} = await axios.post(backendUrl + '/api/auth/send-reset-otp', {email})
        data.success ? toast.success(data.message) : toast.error(data.message) 
        data.success && setIsEmailSent(true)
      } catch (error) {
        toast.error(error.message)
      } finally{
        setCodeLoading(false);
      }
    }

    const onSubmitOTP = async(e) => {
      setVerifyLoading(true);
      try{
      e.preventDefault()
      const otpArray = inputRefs.current.map(e => e.value)
      setOtp(otpArray.join(''))
      setIsOtpSubmitted(true)
    } finally{
        setVerifyLoading(false);
    }
    }

    const onSubmitNewPassword = async (e) => {
      e.preventDefault()
      setResetLoading(true)
      try {
        const {data} = await axios.post(backendUrl + '/api/auth/reset-password', {email, otp, newPassword})
        data.success ? toast.success(data.message): toast.error(data.message)
        data.success && navigate('/login')
      } catch (error) {
        toast.error(error.message)
      } finally{
        setResetLoading(false)
      }
    }

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center px-6'>
      {/* Home Button */}
      <button 
        onClick={() => navigate('/')} 
        className='btn btn-ghost btn-circle absolute left-5 sm:left-20 top-5 hover:scale-110 transition-transform duration-300'
      >
        <Home className='w-8 h-8' />
      </button>

      {/* Step 1: Email Input */}
      {!isEmailSent && (
        <div className='card w-full max-w-md bg-base-300 shadow-2xl animate-in fade-in duration-500'>
          <div className='card-body'>
            <div className='text-center space-y-3 mb-6'>
              <div className='w-16 h-16 mx-auto bg-error/20 rounded-full flex items-center justify-center'>
                <KeyRound className='w-8 h-8 text-error' />
              </div>
              <h1 className='text-3xl font-bold text-base-content'>Reset Password</h1>
              <p className='text-base-content/70 text-sm'>
                Enter your registered email address to receive reset code
              </p>
            </div>

            <form onSubmit={onSubmitEmail} className='space-y-6'>
              <div className='form-control'>
                <label className='input input-bordered flex items-center gap-3 focus-within:input-primary transition-colors duration-200'>
                  <Mail className='w-5 h-5 text-base-content/50' />
                  <input 
                    type="email" 
                    placeholder='Email Address' 
                    className='grow bg-transparent outline-none' 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </label>
              </div>
              
              <button 
                type="submit"
                className='btn btn-primary w-full text-lg font-medium hover:scale-105 transition-transform duration-200'
                disabled= {codeLoading}
              >
               {codeLoading ? <LoaderIcon className="animate-spin w-5 h-5 sm:w-6 sm:h-6" /> : 'Send Reset Code'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {!isOtpSubmitted && isEmailSent && (
        <div className='card w-full max-w-md bg-base-300 shadow-2xl animate-in fade-in duration-500'>
          <div className='card-body'>
            <div className='text-center space-y-3 mb-6'>
              <div className='w-16 h-16 mx-auto bg-info/20 rounded-full flex items-center justify-center'>
                <Shield className='w-8 h-8 text-info' />
              </div>
              <h1 className='text-3xl font-bold text-base-content'>Verify Code</h1>
              <p className='text-base-content/70 text-sm'>
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <form onSubmit={onSubmitOTP} className='space-y-6'>
              <div className='flex justify-center gap-3' onPaste={handlePaste}>
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

              <div className='flex gap-3'>
                <button 
                  type="button"
                  onClick={() => setIsEmailSent(false)}
                  className='btn btn-outline flex-1 hover:scale-105 transition-transform duration-200'
                >
                  <ArrowLeft className='w-5 h-5' />
                  Back
                </button>
                <button 
                  type="submit"
                  className='btn btn-primary flex-1 hover:scale-105 transition-transform duration-200'
                  disabled = {verifyLoading}
                >
                  {verifyLoading? <LoaderIcon className="animate-spin w-5 h-5 sm:w-6 sm:h-6" />: "Verify Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 3: New Password */}
      {isOtpSubmitted && isEmailSent && (
        <div className='card w-full max-w-sm sm:max-w-md bg-base-300 shadow-2xl animate-in fade-in duration-500 mx-4'>
          <div className='card-body p-6 sm:p-8'>
            <div className='text-center space-y-2 sm:space-y-3 mb-4 sm:mb-6'>
              <div className='w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-success/20 rounded-full flex items-center justify-center'>
                <Lock className='w-6 h-6 sm:w-8 sm:h-8 text-success' />
              </div>
              <h1 className='text-2xl sm:text-3xl font-bold text-base-content'>New Password</h1>
              <p className='text-base-content/70 text-xs sm:text-sm px-2'>
                Create a strong new password for your account
              </p>
            </div>

            <form onSubmit={onSubmitNewPassword} className='space-y-4 sm:space-y-6'>
              <div className='form-control'>
                <label className='input input-bordered flex items-center gap-3 focus-within:input-primary transition-colors duration-200 text-sm sm:text-base'>
                  <Lock className='w-4 h-4 sm:w-5 sm:h-5 text-base-content/50 flex-shrink-0' />
                  <input 
                    type="password" 
                    placeholder='New Password' 
                    className='grow bg-transparent outline-none min-w-0' 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    required 
                  />
                </label>
              </div>

              <div className='flex flex-col sm:flex-row gap-3'>
                <button 
                  type="button"
                  onClick={() => setIsOtpSubmitted(false)}
                  className='btn btn-outline hover:scale-105 transition-transform duration-200 order-2 sm:order-1 sm:flex-1 h-12 sm:h-auto'
                >
                  <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5' />
                  <span className='hidden sm:inline'>Back</span>
                </button>
                <button 
                  type="submit"
                  className='btn btn-success hover:scale-105 transition-transform duration-200 order-1 sm:order-2 sm:flex-1 h-12 sm:h-auto'
                  disabled = {resetLoading}
                >
                  {resetLoading? <LoaderIcon className="animate-spin w-5 h-5 sm:w-6 sm:h-6" />: "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResetPasswordPage