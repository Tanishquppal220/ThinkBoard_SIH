import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Heart, Volume2, List, Music, RefreshCw } from 'lucide-react';
import { useContext } from 'react';
import { AppContent } from '../context/AppContext';

const MusicPage = ({ initialPlaylist = 'mix' }) => {
  // Spotify API Configuration
  const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your_spotify_client_id';
  const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || 'your_spotify_client_secret';
//   const SPOTIFY_REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback';
  
  // State for API
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const {backendUrl} = useContext(AppContent);

  // Emotion-based playlist configurations for Spotify API
  const playlistConfigs = {
    happy: {
      name: 'Happy Vibes',
      color: 'bg-yellow-400',
      icon: '😊',
      searchQuery: 'genre:pop,dance valence:0.7..1.0 energy:0.7..1.0',
      seeds: ['happy', 'upbeat', 'feel good', 'dance', 'pop']
    },
    sad: {
      name: 'Melancholy',
      color: 'bg-blue-600',
      icon: '😢',
      searchQuery: 'genre:indie,alternative valence:0.0..0.3 energy:0.0..0.5',
      seeds: ['sad', 'melancholy', 'emotional', 'slow', 'heartbreak']
    },
    angry: {
      name: 'Rage Mode',
      color: 'bg-red-600',
      icon: '😡',
      searchQuery: 'genre:metal,rock,hard-rock energy:0.8..1.0 loudness:-5..0',
      seeds: ['angry', 'aggressive', 'metal', 'rock', 'intense']
    },
    neutral: {
      name: 'Chill Vibes',
      color: 'bg-gray-500',
      icon: '😐',
      searchQuery: 'genre:ambient,chill,lo-fi valence:0.4..0.6 energy:0.3..0.7',
      seeds: ['chill', 'ambient', 'relaxing', 'neutral', 'calm']
    }
  };

  const [playlists, setPlaylists] = useState({});
  const [currentPlaylist, setCurrentPlaylist] = useState(initialPlaylist);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState([]);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const audioRef = useRef(null);

  // Get Spotify Access Token
  const getSpotifyAccessToken = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/emotion/spotify-token');

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    setAccessToken(data.access_token);
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    setError('Failed to authenticate with Spotify');
    return null;
  }
};

  // Search Spotify for tracks
  const searchSpotifyTracks = async (query, limit = 15) => {
  try {
    const res = await fetch(`${backendUrl}/api/emotion/spotify-search?query=${encodeURIComponent(query)}&limit=${limit}`);
    const data = await res.json();
    return data.tracks || [];
  } catch (err) {
    console.error('Error searching tracks:', err);
    return [];
  }
};

  // Get recommendations from Spotify
  const getSpotifyRecommendations = async (seedGenres, targetAudioFeatures = {}, limit = 15) => {
  try {
    const params = new URLSearchParams({
      seedGenres: seedGenres.join(','),
      limit: limit.toString(),
      ...targetAudioFeatures
    });

    const res = await fetch(`${backendUrl}/api/emotion/spotify-recommendations?${params}`);
    const data = await res.json();
    return data.tracks || [];
  } catch (err) {
    console.error('Error getting recommendations:', err);
    return [];
  }
};

  // Load playlist for specific emotion
  const loadPlaylist = async (emotion) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = playlistConfigs[emotion];
      if (!config) return;

      // Try to get recommendations first, fallback to search
      let tracks = [];
      
      // Get recommendations based on audio features
      const audioFeatures = getAudioFeaturesForEmotion(emotion);
      const availableGenres = await getAvailableGenres();
      const relevantGenres = getRelevantGenres(emotion, availableGenres);
      
      if (relevantGenres.length > 0) {
        tracks = await getSpotifyRecommendations(relevantGenres, audioFeatures, 15);
      }

      // If recommendations failed or returned few results, fallback to search
      if (tracks.length < 10) {
        const searchResults = await searchSpotifyTracks(config.searchQuery, 15);
        tracks = [...tracks, ...searchResults].slice(0, 15);
      }

      // Remove tracks without preview URLs and deduplicate
      const validTracks = tracks
        .filter(track => track.audio && track.audio !== null)
        .filter((track, index, self) => 
          index === self.findIndex(t => t.id === track.id)
        );

      setPlaylists(prev => ({
        ...prev,
        [emotion]: {
          ...config,
          songs: validTracks
        }
      }));

    } catch (error) {
      console.error(`Error loading ${emotion} playlist:`, error);
      setError(`Failed to load ${emotion} playlist`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get audio features based on emotion
  const getAudioFeaturesForEmotion = (emotion) => {
    const features = {
      happy: {
        target_valence: 0.8,
        target_energy: 0.8,
        target_danceability: 0.7,
        min_tempo: 120,
        max_tempo: 140
      },
      sad: {
        target_valence: 0.2,
        target_energy: 0.3,
        target_acousticness: 0.6,
        min_tempo: 60,
        max_tempo: 100
      },
      angry: {
        target_valence: 0.3,
        target_energy: 0.9,
        target_loudness: -5,
        min_tempo: 140,
        max_tempo: 180
      },
      neutral: {
        target_valence: 0.5,
        target_energy: 0.5,
        target_acousticness: 0.4,
        min_tempo: 90,
        max_tempo: 120
      }
    };
    return features[emotion] || {};
  };

  // Get available genres from Spotify
  const getAvailableGenres = async () => {
  try {
    const response = await fetch(`${backendUrl}/api/emotion/spotify-genres`);
    if (!response.ok) return [];

    const data = await response.json();
    return data.genres || [];
  } catch (error) {
    console.error('Error getting available genres:', error);
    return [];
  }
};

  // Get relevant genres for emotion
  const getRelevantGenres = (emotion, availableGenres) => {
    const genreMap = {
      happy: ['pop', 'dance', 'disco', 'funk', 'happy', 'party'],
      sad: ['indie', 'alternative', 'sad', 'blues', 'folk', 'acoustic'],
      angry: ['metal', 'rock', 'hard-rock', 'punk', 'hardcore', 'heavy-metal'],
      neutral: ['ambient', 'chill', 'lo-fi', 'downtempo', 'new-age', 'instrumental']
    };

    const preferredGenres = genreMap[emotion] || [];
    return preferredGenres.filter(genre => availableGenres.includes(genre)).slice(0, 5);
  };

  // Create mix playlist from all loaded playlists
  const createMixPlaylist = () => {
    const allSongs = [];
    Object.values(playlists).forEach(playlist => {
      if (playlist.songs) {
        allSongs.push(...playlist.songs);
      }
    });
    
    // Shuffle and remove duplicates
    const uniqueSongs = allSongs.filter((song, index, self) => 
      index === self.findIndex(s => s.id === song.id)
    );
    
    return {
      name: 'Mix Playlist',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      icon: '🎵',
      songs: uniqueSongs.sort(() => Math.random() - 0.5)
    };
  };

  // Initialize playlists on component mount
  useEffect(() => {
    const initializePlaylists = async () => {
      await getSpotifyAccessToken();
      
      // Load all emotion playlists
      for (const emotion of Object.keys(playlistConfigs)) {
        await loadPlaylist(emotion);
      }
    };

    initializePlaylists();
  }, []);

  // Update mix playlist when other playlists change
  useEffect(() => {
    const hasAllPlaylists = Object.keys(playlistConfigs).every(emotion => 
      playlists[emotion] && playlists[emotion].songs
    );

    if (hasAllPlaylists) {
      setPlaylists(prev => ({
        ...prev,
        mix: createMixPlaylist()
      }));
    }
  }, [Object.keys(playlists).length]);

  const currentPlaylistData = playlists[currentPlaylist];
  const currentSong = currentPlaylistData?.songs?.[currentSongIndex];

  // Initialize shuffled indices
  useEffect(() => {
    if (currentPlaylistData?.songs) {
      const indices = Array.from({ length: currentPlaylistData.songs.length }, (_, i) => i);
      setShuffledIndices(indices.sort(() => Math.random() - 0.5));
    }
  }, [currentPlaylist, currentPlaylistData]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      nextSong();
    };
    const handleError = () => {
      console.error('Audio failed to load:', currentSong?.title);
      nextSong(); // Skip to next song if current fails
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentSong]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setError('Unable to play this track');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const nextSong = () => {
    if (!currentPlaylistData?.songs?.length) return;

    if (isShuffle) {
      const currentShuffleIndex = shuffledIndices.findIndex(index => index === currentSongIndex);
      const nextShuffleIndex = (currentShuffleIndex + 1) % shuffledIndices.length;
      setCurrentSongIndex(shuffledIndices[nextShuffleIndex]);
    } else {
      setCurrentSongIndex((prev) => (prev + 1) % currentPlaylistData.songs.length);
    }
  };

  const previousSong = () => {
    if (!currentPlaylistData?.songs?.length) return;

    if (isShuffle) {
      const currentShuffleIndex = shuffledIndices.findIndex(index => index === currentSongIndex);
      const prevShuffleIndex = currentShuffleIndex === 0 ? shuffledIndices.length - 1 : currentShuffleIndex - 1;
      setCurrentSongIndex(shuffledIndices[prevShuffleIndex]);
    } else {
      setCurrentSongIndex((prev) => prev === 0 ? currentPlaylistData.songs.length - 1 : prev - 1);
    }
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const progressBar = e.currentTarget;
    const clickX = e.nativeEvent.offsetX;
    const width = progressBar.offsetWidth;
    const newTime = (clickX / width) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
    if (!isShuffle && currentPlaylistData?.songs) {
      const indices = Array.from({ length: currentPlaylistData.songs.length }, (_, i) => i);
      setShuffledIndices(indices.sort(() => Math.random() - 0.5));
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const selectSong = (index) => {
    setCurrentSongIndex(index);
    setShowPlaylist(false);
  };

  const switchPlaylist = async (playlistKey) => {
    setCurrentPlaylist(playlistKey);
    setCurrentSongIndex(0);
    setIsPlaying(false);
    
    // If playlist doesn't exist and it's not mix, load it
    if (playlistKey !== 'mix' && !playlists[playlistKey]?.songs) {
      await loadPlaylist(playlistKey);
    }
  };

  const refreshPlaylist = async (playlistKey) => {
    if (playlistKey === 'mix') {
      // Refresh all playlists to update mix
      for (const emotion of Object.keys(playlistConfigs)) {
        await loadPlaylist(emotion);
      }
    } else {
      await loadPlaylist(playlistKey);
    }
  };

  // Generate shareable playlist link
  const getPlaylistLink = (playlistKey) => {
    return `${window.location.origin}${window.location.pathname}?playlist=${playlistKey}`;
  };

  const copyPlaylistLink = (playlistKey) => {
    const link = getPlaylistLink(playlistKey);
    navigator.clipboard.writeText(link).then(() => {
      // You could add a toast notification here
      console.log('Playlist link copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  };

  const openInSpotify = () => {
    if (currentSong?.spotifyUrl) {
      window.open(currentSong.spotifyUrl, '_blank');
    }
  };

  // Get total songs count
  const getTotalSongs = () => {
    return Object.values(playlists).reduce((total, playlist) => {
      return total + (playlist.songs?.length || 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">🎵 MoodTunes</h1>
          <p className="text-base-content/70">Music that matches your emotions • Powered by Spotify</p>
          {isLoading && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading playlists...</span>
            </div>
          )}
          {error && (
            <div className="alert alert-error mt-2">
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Playlist Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {Object.entries({ ...playlistConfigs, mix: { name: 'Mix Playlist', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '🎵' } }).map(([key, config]) => {
            const playlistData = playlists[key];
            const songCount = playlistData?.songs?.length || 0;
            
            return (
              <div key={key} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body p-4">
                  <div className={`w-full h-32 rounded-lg ${config.color} flex items-center justify-center text-4xl mb-2 relative`}>
                    {config.icon}
                    {isLoading && !songCount && (
                      <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="card-title text-sm">{config.name}</h3>
                  <p className="text-xs text-base-content/70">
                    {songCount > 0 ? `${songCount} songs` : 'Loading...'}
                  </p>
                  <div className="card-actions justify-between mt-2">
                    <button 
                      className={`btn btn-xs ${currentPlaylist === key ? 'btn-primary' : 'btn-outline'} ${!songCount ? 'btn-disabled' : ''}`}
                      onClick={() => switchPlaylist(key)}
                      disabled={!songCount}
                    >
                      Play
                    </button>
                    <div className="flex gap-1">
                      <button 
                        className="btn btn-xs btn-ghost"
                        onClick={() => refreshPlaylist(key)}
                        disabled={isLoading}
                        title="Refresh playlist"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <button 
                        className="btn btn-xs btn-ghost"
                        onClick={() => copyPlaylistLink(key)}
                        title="Copy playlist link"
                      >
                        🔗
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Playing Section */}
        {currentPlaylistData && currentSong ? (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Album Art */}
                <div className="flex-shrink-0">
                  <img 
                    src={currentSong.image} 
                    alt={currentSong.title}
                    className="w-48 h-48 rounded-lg shadow-lg mx-auto lg:mx-0 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300/333/fff?text=No+Image';
                    }}
                  />
                </div>
                
                {/* Song Info & Controls */}
                <div className="flex-grow">
                  <div className="text-center lg:text-left mb-4">
                    <h2 className="text-2xl font-bold text-primary">{currentSong.title}</h2>
                    <p className="text-lg text-base-content/70">{currentSong.artist}</p>
                    <p className="text-sm text-base-content/50">{currentPlaylistData.name}</p>
                    {currentSong.spotifyUrl && (
                      <button 
                        className="btn btn-xs btn-success mt-2"
                        onClick={openInSpotify}
                      >
                        🎵 Open in Spotify
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div 
                      className="w-full bg-base-300 rounded-full h-2 cursor-pointer"
                      onClick={handleProgressClick}
                    >
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-100"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-base-content/70 mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button 
                      className={`btn btn-circle ${isShuffle ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={toggleShuffle}
                    >
                      <Shuffle className="w-5 h-5" />
                    </button>
                    <button className="btn btn-circle btn-ghost" onClick={previousSong}>
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button 
                      className="btn btn-circle btn-primary btn-lg" 
                      onClick={togglePlayPause}
                      disabled={!currentSong?.audio}
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button className="btn btn-circle btn-ghost" onClick={nextSong}>
                      <SkipForward className="w-5 h-5" />
                    </button>
                    <button 
                      className="btn btn-circle btn-ghost"
                      onClick={() => setShowPlaylist(!showPlaylist)}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (audioRef.current) {
                          audioRef.current.volume = parseFloat(e.target.value);
                        }
                      }}
                      className="range range-primary range-sm w-32"
                    />
                  </div>

                  {/* No Preview Warning */}
                  {currentSong && !currentSong.audio && (
                    <div className="alert alert-warning mt-4">
                      <span>⚠️ No preview available for this track. Try opening in Spotify!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body text-center">
              <h2 className="text-xl">Select a playlist to start listening</h2>
              <p className="text-base-content/70">Choose an emotion-based playlist above</p>
            </div>
          </div>
        )}

        {/* Playlist Display */}
        {showPlaylist && currentPlaylistData?.songs && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Current Playlist: {currentPlaylistData.name}</h3>
                <button 
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowPlaylist(false)}
                >
                  ✕
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {currentPlaylistData.songs.map((song, index) => (
                  <div 
                    key={song.id}
                    className={`flex items-center gap-4 p-3 rounded-lg hover:bg-base-200 cursor-pointer transition-colors ${
                      index === currentSongIndex ? 'bg-primary/10 border-l-4 border-primary' : ''
                    }`}
                    onClick={() => selectSong(index)}
                  >
                    <img 
                      src={song.image} 
                      alt={song.title}
                      className="w-12 h-12 rounded object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48x48/333/fff?text=♪';
                      }}
                    />
                    <div className="flex-grow">
                      <p className="font-medium">{song.title}</p>
                      <p className="text-sm text-base-content/70">{song.artist}</p>
                      {!song.audio && (
                        <p className="text-xs text-warning">No preview available</p>
                      )}
                    </div>
                    <div className="text-sm text-base-content/50">
                      {formatTime(song.duration)}
                    </div>
                    {index === currentSongIndex && isPlaying && (
                      <div className="text-primary">
                        <Music className="w-4 h-4" />
                      </div>
                    )}
                    <button 
                      className="btn btn-xs btn-ghost opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (song.spotifyUrl) window.open(song.spotifyUrl, '_blank');
                      }}
                    >
                      🎵
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Playing</div>
            <div className="stat-value text-info text-lg">{isPlaying ? 'YES' : 'NO'}</div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef}
          src={currentSong?.audio}
          volume={volume}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />

        {/* Environment Setup Instructions */}
        <div className="mt-8 p-4 bg-info/10 rounded-lg">
          <h4 className="font-bold mb-2">🔧 Environment Variables Setup:</h4>
          <div className="text-sm space-y-1">
            <p><code className="bg-base-300 px-2 py-1 rounded">REACT_APP_SPOTIFY_CLIENT_ID</code> - Your Spotify app's Client ID</p>
            <p><code className="bg-base-300 px-2 py-1 rounded">REACT_APP_SPOTIFY_CLIENT_SECRET</code> - Your Spotify app's Client Secret</p>
            <p><code className="bg-base-300 px-2 py-1 rounded">REACT_APP_SPOTIFY_REDIRECT_URI</code> - Redirect URI (e.g., http://localhost:3000/callback)</p>
          </div>
          <div className="mt-3 text-xs text-base-content/70">
            <p>📝 Create a Spotify app at: <a href="https://developer.spotify.com/dashboard" className="link">https://developer.spotify.com/dashboard</a></p>
            <p>🎵 This uses Spotify's Web API with 30-second preview clips</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPage;