import React, {useContext, useEffect, useState} from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import {PlusIcon, User, LoaderIcon, LogOut, Settings, Camera} from 'lucide-react'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import api from "../lib/axios";
import { useSocketStore } from '../store/useSocketStore'


const Navbar = () => {

  const {userData, backendUrl, setUserData, setIsLoggedin} = useContext(AppContent);
  const [loading,setLoading] = useState(false);
  const [logoutLoading,setLogoutLoading] = useState(false);
  const [uploading,setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const navigate = useNavigate();
  const location = useLocation(); // Add this to get current route

  const sendVerificationOtp = async ()=>{
    setLoading(true);
    try {
        axios.defaults.withCredentials = true;
        const {data} = await axios.post(backendUrl + '/api/auth/send-verify-otp')

        if(data.success){
          navigate('/email-verify')
          toast.success(data.message)
        }else{
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.message)
      }finally{
        setLoading(false);
      }

}

useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get("/api/user/data"); // adjust endpoint
        // console.log("API Response:", res.data);
        if (res.data.success) {
          setImageUrl(res.data.userData.profilePic); // Cloudinary URL stored in DB
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUserData();
  }, []);


const handleUpload = async (e) => {
    setUploading(true);
    const file = e.target.files[0];
    console.log(file);
    try {
         if (!file) return alert("Please select a file!");

    const formData = new FormData();
    formData.append("profilePic", file);

    const res = await api.put("/api/user/update-profile-pic", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.success) {
      setImageUrl(res.data.userData.profilePic); // Cloudinary URL
    }
    } catch (error) {
        console.error("Error uploading file:", error);
        
    } finally{
      setUploading(false);
    }
   
  };

const logout = async ()=>{
  setLogoutLoading(true);
  try {
    axios.defaults.withCredentials = true;
    const {data} = await axios.post(backendUrl + '/api/auth/logout');
    

  data.success && setIsLoggedin(false);
  data.success &&  setUserData(false);
  useSocketStore.getState().disconnectSocket();


  navigate('/')
  window.location.reload();
  } catch (error) {
    toast.error(error.message);  
  } finally{
    setLogoutLoading(false);
  }
}

  // Check if current route is /note (NoteHomePage)
  const isNotePage = location.pathname === '/note';

  return (
    <header className='bg-base-300 border-b border-base-content/10 mb-11 fixed top-0 left-0 w-full z-50'>
      <div className='p-4 mx-auto max-w-6xl flex items-center justify-between'>
          <Link to='/' className='text-3xl font-bold text-primary tracking-tight'>ThinkBoard</Link>
        <div className='flex items-center gap-4'>
          {/* Only show New note button when on /note route */}
          {isNotePage && (
            <Link to='/create' className='btn btn-primary'>
              <PlusIcon className='size-5'/>
              <span>New note</span>
            </Link>
          )}
          
          {userData ? 
          (<div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="avatar placeholder btn btn-ghost btn-circle  ">
              <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 flex items-center justify-center overflow-hidden">
                {uploading ? (
                  <LoaderIcon className="animate-spin size-4 text-primary" />
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {userData.name[0].toUpperCase()}
                  </span>
                )}
              </div>

            </div>
  
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-40 py-2 px-2 shadow-lg border border-base-300">
              {!userData.isAccountVerified && (
                <li>
                  <div onClick={sendVerificationOtp} className="hover:bg-primary hover:text-primary-content transition-colors     duration-200 rounded-lg cursor-pointer p-2">
                    {loading ? <LoaderIcon className="animate-spin size-3 text-primary" /> : 'Verify Account'}
                  </div>
                </li>
              )}
              <li>
                <div 
                  onClick={logout} 
                  className="hover:brightness-110  transition-colors duration-200 rounded-lg cursor-pointer p-2 flex items-center"
                >
                  <LogOut className='size-4 text-error' />
                  {logoutLoading ? <LoaderIcon className="animate-spin size-3 text-primary text-center" /> : 'Logout'}
                </div>
              </li>
              <li>
                <Link
                  to = '/settings'
                  className="group hover:brightness-110  transition-all duration-200 rounded-lg cursor-pointer p-2"
                >
                  <Settings className='size-4 text-muted group-hover:animate-spin duration' />
                  Settings
                </Link>
              </li>
              <li>
                <div
                  className=" hover:brightness-110  transition-all duration-200 rounded-lg cursor-pointer p-2"
                  onClick={() => document.getElementById('avatar-upload').click()}
                  >
                  <Camera className='size-4 text-primary ' />
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                  />  
                    {uploading ? <LoaderIcon className="animate-spin size-3 text-primary" /> : 'Profile Pic'}
                  

                  
                </div>
              </li>

            </ul>
          </div>)
          : <Link to= '/login' className='btn btn-primary px-6'>
          <User className='size-5'/>
          <span>Login</span>
          </Link>}
          
        </div>
      </div>
    </header>
  )
}

export default Navbar