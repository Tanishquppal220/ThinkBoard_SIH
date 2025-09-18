import React, { useState, useEffect } from 'react'
import { PenTool, MessageCircle, Plus, Users, FileText, Music, Loader2, MapPin, LocateFixed, Navigation } from 'lucide-react'
import { Link } from 'react-router'
import Navbar from '../components/Navbar'

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [cardLoading, setCardLoading] = useState({ notes: false, chat: false, location: false })

  useEffect(() => {
    // Simulate page loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1200)

    return () => clearTimeout(timer)
  }, [])

  const handleCardClick = (cardType) => {
    setCardLoading(prev => ({ ...prev, [cardType]: true }))
    // Simulate navigation delay
    setTimeout(() => {
      setCardLoading(prev => ({ ...prev, [cardType]: false }))
    }, 800)
  }

  // Page Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-secondary opacity-20 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            ThinkBoard
          </h1>
          <div className="flex items-center justify-center gap-2 opacity-60">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="mt-4 opacity-60">Loading your creative workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100 animate-fadeIn">
      <Navbar/>
      
      {/* Hero Section */}
      <div className="hero min-h-[60vh] bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="hero-content text-center">
          <div className="max-w-md animate-slideUp">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ThinkBoard
            </h1>
            <p className="py-6 text-lg opacity-80">
              Your ultimate companion for notes, music, and meaningful conversations. 
              Organize your thoughts, enjoy your tunes, and connect with others.
            </p>
            <div className="flex gap-4 justify-center">
              <div className="badge badge-primary badge-lg flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Notes
              </div>
              <div className="badge badge-secondary badge-lg flex items-center gap-1">
                <Music className="w-3 h-3" />
                Music
              </div>
              <div className="badge badge-accent badge-lg flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                Chat
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 animate-slideUp">
          <h2 className="text-3xl font-bold mb-4">Choose Your Journey</h2>
          <p className="text-lg opacity-70">Start organizing, creating, and connecting today</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Notes Card */}
          <Link 
            to="/note" 
            onClick={() => handleCardClick('notes')}
            className="block animate-slideUp"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="card bg-base-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 group border border-base-300 hover:border-primary/50 cursor-pointer h-full">
              <div className="card-body p-8 relative overflow-hidden">
                {cardLoading.notes && (
                  <div className="absolute inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                      <p className="text-sm opacity-60">Loading Notes...</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                  <PenTool className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                
                <h3 className="card-title text-2xl justify-center mb-4 group-hover:text-primary transition-colors duration-300">
                  Smart Notes
                </h3>
                
                <p className="text-center opacity-80 mb-6 leading-relaxed">
                  Create, organize, and manage your thoughts with our intuitive note-taking system. 
                  Perfect for students, professionals, and anyone who values organized thinking.
                </p>
                
                <div className="card-actions justify-center">
                  <div className="btn btn-primary btn-wide group-hover:btn-outline group-hover:scale-105 transition-all duration-300">
                    <Plus className="w-5 h-5 mr-2" />
                    Start Writing
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                  <FileText className="w-12 h-12 text-primary" strokeWidth={1} />
                </div>
              </div>
            </div>
          </Link>

          {/* Chat Card */}
          <Link 
            to="/chat" 
            onClick={() => handleCardClick('chat')}
            className="block animate-slideUp"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="card bg-base-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 group border border-base-300 hover:border-secondary/50 cursor-pointer h-full">
              <div className="card-body p-8 relative overflow-hidden">
                {cardLoading.chat && (
                  <div className="absolute inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-secondary animate-spin mx-auto mb-2" />
                      <p className="text-sm opacity-60">Loading Chat...</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-secondary/10 group-hover:bg-secondary/20 transition-colors duration-300">
                  <MessageCircle className="w-8 h-8 text-secondary group-hover:scale-110 transition-transform duration-300" />
                </div>
                
                <h3 className="card-title text-2xl justify-center mb-4 group-hover:text-secondary transition-colors duration-300">
                  Music Chat
                </h3>
                
                <p className="text-center opacity-80 mb-6 leading-relaxed">
                  Connect through music and conversations. Share your favorite tracks, 
                  discover new artists, and build meaningful connections with fellow music lovers.
                </p>
                
                <div className="card-actions justify-center">
                  <div className="btn btn-secondary btn-wide group-hover:btn-outline group-hover:scale-105 transition-all duration-300">
                    <Users className="w-5 h-5 mr-2" />
                    Start Chatting
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                  <Users className="w-12 h-12 text-secondary" strokeWidth={1} />
                </div>
              </div>
            </div>
          </Link>
          {/* Location Card */}
          <Link 
            to="/location" 
            onClick={() => handleCardClick('location')}
            className="block animate-slideUp"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="card bg-base-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 group border border-base-300 hover:border-primary/50 cursor-pointer h-full">
              <div className="card-body p-8 relative overflow-hidden">
                {cardLoading.notes && (
                  <div className="absolute inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                      <p className="text-sm opacity-60">Loading location...</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                  <Navigation className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                
                <h3 className="card-title text-2xl justify-center mb-4 group-hover:text-primary transition-colors duration-300">
                  Locate Friends
                </h3>
                
                <p className="text-center opacity-80 mb-6 leading-relaxed">
                  Feeling lonely? Easily locate your friends and see where they are in real-time. Perfect for staying connected, planning meetups, or just knowing your circle is close by
                </p>
                
                <div className="card-actions justify-center">
                  <div className="btn btn-primary btn-wide group-hover:btn-outline group-hover:scale-105 transition-all duration-300">
                    <LocateFixed className="w-5 h-5 mr-2" />
                    Start Locating
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                  <FileText className="w-12 h-12 text-primary" strokeWidth={1} />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Enhanced Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
          <div className="card bg-base-200/50 shadow-lg animate-slideUp" style={{ animationDelay: '0.6s' }}>
            <div className="card-body text-center p-6">
              <FileText className="w-10 h-10 text-primary mx-auto mb-4" />
              <h4 className="card-title text-lg justify-center mb-2">Organized Notes</h4>
              <p className="opacity-70 text-sm">
                Keep your thoughts structured with tags, categories, and powerful search functionality.
              </p>
            </div>
          </div>

          <div className="card bg-base-200/50 shadow-lg animate-slideUp" style={{ animationDelay: '0.8s' }}>
            <div className="card-body text-center p-6">
              <Music className="w-10 h-10 text-secondary mx-auto mb-4" />
              <h4 className="card-title text-lg justify-center mb-2">Music Integration</h4>
              <p className="opacity-70 text-sm">
                Listen to your favorite tracks while taking notes or chatting with friends.
              </p>
            </div>
          </div>

          <div className="card bg-base-200/50 shadow-lg animate-slideUp" style={{ animationDelay: '1s' }}>
            <div className="card-body text-center p-6">
              <MessageCircle className="w-10 h-10 text-accent mx-auto mb-4" />
              <h4 className="card-title text-lg justify-center mb-2">Real-time Chat</h4>
              <p className="opacity-70 text-sm">
                Connect instantly with others who share your musical tastes and interests.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 animate-slideUp" style={{ animationDelay: '1.2s' }}>
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Digital Experience?</h3>
            <p className="opacity-70 mb-6">
              Join our community of creators, thinkers, and music lovers who have discovered 
              the perfect balance of productivity and connection.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.6s ease-out both;
        }
      `}</style>
    </div>
  )
}

export default HomePage