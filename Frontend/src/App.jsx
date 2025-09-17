import React from 'react'
import {Route,Routes} from 'react-router';
import NoteHomePage from './pages/NoteHomePage';
import CreatePage from './pages/CreatePage';
import NoteDetailPage from './pages/NoteDetailPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerifyPage from './pages/EmailVerifyPage';
import SettingPage from './pages/SettingPage';
import { useThemeStore } from './lib/useTheme';
import ProfilePicUpdate from './components/ProfilePicUpdate';
import ChatHomePage from './pages/ChatHomePage';
import HomePage from './pages/HomePage';
import CallPage from './pages/CallPage';
import IncomingCall from './components/IncomingCall';
import LocationPage from './pages/LocationPage';


const App = () => {
  const {theme} = useThemeStore();
  return (
    <div className="relative h-full w-full" data-theme={theme}>




      <Routes>
        <Route path = '/' element= {<HomePage/>}/>
        <Route path = '/note' element = {<NoteHomePage/>}/>
        <Route path = '/create' element = {<CreatePage/>}/>
        <Route path = '/note/:id' element = {<NoteDetailPage/>}/>
        <Route path = '/login' element = {<LoginPage/>}/>
        <Route path = '/reset-password' element = {<ResetPasswordPage/>}/>
        <Route path = '/email-verify' element = {<EmailVerifyPage/>}/>
        <Route path = '/settings' element = {<SettingPage/>}/>
        <Route path = '/profile-pic-update' element = {<ProfilePicUpdate/>}/>
        <Route path = '/chat' element= {<ChatHomePage/>}/>
        <Route path = '/call/:callId' element= {<CallPage/>}/>
        <Route path = '/location' element = {<LocationPage/>}/>
        
        

      </Routes>
      <IncomingCall/>
    </div>
  )
}

export default App



