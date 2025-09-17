import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router'

import axios from 'axios'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Home, LoaderIcon } from 'lucide-react'
import { AppContent } from '../context/AppContext'
import { useSocketStore } from '../store/useSocketStore'

const LoginPage = () => {

    const navigate = useNavigate()

    const {backendUrl, setIsLoggedin, getUserData} = useContext(AppContent);

    const [state, setState] = useState('Sign Up')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false);

    const onSubmithandler = async(e) => {
            e.preventDefault();
            setLoading(true);
        try {
            axios.defaults.withCredentials = true;
            if(state === 'Sign Up'){
                const {data} = await axios.post(backendUrl + '/api/auth/register', {name, email, password})
                if(data.success){
                    setIsLoggedin(true)
                    await getUserData()
                    useSocketStore.getState().connectSocket(data.userId);

                    navigate('/')

                    toast.success('Account created successfully!')
                }else{
                    // toast.error(data.message)
                    console.log(data.message)
                }
            }else{
                const {data} = await axios.post(backendUrl + '/api/auth/login', {email, password})
                if(data.success){
                    setIsLoggedin(true)
                    await getUserData()
                    useSocketStore.getState().connectSocket(data.userId);
                    navigate('/')
                    toast.success('Logged in successfully!')
                }else{
                    // toast.error(data.message)
                    console.log(data.message)
                }
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
                console.log(error.response.data.message)
            } else {
                toast.error('Something went wrong');
                console.log(error)
            }
        } finally{
            setLoading(false);
        }
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center px-4 sm:px-6'>
            {/* Home Button */}
            <button 
                onClick={() => navigate('/')} 
                className='btn btn-ghost btn-circle absolute left-3 sm:left-5 lg:left-20 top-3 sm:top-5 hover:scale-110 transition-transform duration-300 z-10'
            >
                <Home className='w-6 h-6 sm:w-8 sm:h-8' />
            </button>

            {/* Login Card */}
            <div className='card w-full max-w-sm sm:max-w-md bg-base-300 shadow-2xl mx-4'>
                <div className='card-body p-6 sm:p-8'>
                    {/* Header */}
                    <div className='text-center mb-4 sm:mb-6'>
                        <h2 className='text-2xl sm:text-3xl font-bold text-base-content mb-2'>
                            {state === 'Sign Up' ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className='text-base-content/70 text-sm sm:text-base'>
                            {state === 'Sign Up' ? 'Create your account' : 'Login to your account!'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={onSubmithandler} className='space-y-3 sm:space-y-4'>
                        {/* Name Field - Only for Sign Up */}
                        {state === 'Sign Up' && (
                            <div className='form-control'>
                                <label className='input input-bordered flex items-center gap-3 focus-within:input-primary transition-colors duration-200 text-sm sm:text-base'>
                                    <User className='w-4 h-4 sm:w-5 sm:h-5 text-base-content/50 flex-shrink-0' />
                                    <input 
                                        type="text" 
                                        className='grow bg-transparent outline-none min-w-0' 
                                        placeholder='Full Name'
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required 
                                    />
                                </label>
                            </div>
                        )}

                        {/* Email Field */}
                        <div className='form-control'>
                            <label className='input input-bordered flex items-center gap-3 focus-within:input-primary transition-colors duration-200 text-sm sm:text-base'>
                                <Mail className='w-4 h-4 sm:w-5 sm:h-5 text-base-content/50 flex-shrink-0' />
                                <input 
                                    type="email" 
                                    className='grow bg-transparent outline-none min-w-0' 
                                    placeholder='Email Address'
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required 
                                />
                            </label>
                        </div>

                        {/* Password Field */}
                        <div className='form-control'>
                            <label className='input input-bordered flex items-center gap-3 focus-within:input-primary transition-colors duration-200 text-sm sm:text-base'>
                                <Lock className='w-4 h-4 sm:w-5 sm:h-5 text-base-content/50 flex-shrink-0' />
                                <input 
                                    type="password" 
                                    className='grow bg-transparent outline-none min-w-0' 
                                    placeholder='Password'
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required 
                                />
                            </label>
                        </div>

                        {/* Forgot Password - Only for Login */}
                        {state === 'Login' && (
                            <div className='text-right pt-2'>
                                <button 
                                    type="button"
                                    onClick={() => navigate('/reset-password')} 
                                    className='link link-primary text-xs sm:text-sm hover:link-hover'
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className='pt-2'>
                            <button 
                                type="submit"
                                className='btn btn-primary w-full text-base sm:text-lg font-medium hover:scale-105 transition-transform duration-200 h-12 sm:h-auto' 
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className='flex items-center gap-2'>
                                        <LoaderIcon className="animate-spin w-5 h-5 sm:w-6 sm:h-6" />
                                        <span className='text-sm sm:text-base'>Loading...</span>
                                    </div>
                                ) : (
                                    state
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Toggle between Sign Up and Login */}
                    <div className='text-center mt-4 sm:mt-6'>
                        <p className='text-base-content/70 text-xs sm:text-sm'>
                            {state === 'Sign Up' ? 'Already have an account? ' : "Don't have an account? "}
                            <button 
                                onClick={() => !loading && setState(state === 'Sign Up' ? 'Login' : 'Sign Up')}
                                disabled={loading}
                                className='link link-primary font-medium hover:link-hover disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                {state === 'Sign Up' ? "Login here" : "Sign Up"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage