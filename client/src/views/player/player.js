import { Link, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchCurrentlyPlaying, skipToNextTrack, skipToPreviousTrack, searchSongs, queueSong, fetchUserProfile, fetchPlaybackState } from "../../logic/playback";
import "./player.css";

export default function Player() {
    // variables
    const location = useLocation();
    const params = useParams(); // hooks must be called UNconditionally **used to get roomCode from the URL
    const [token, setToken] = useState(null);  // not passing in token: getting from roomCode (for new tabs + other users)
    const roomCode = params.roomCode; // getting roomCode from URL

    const [nowPlaying, setNowPlaying] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [queuedMessage, setQueuedMessage] = useState("");

    

    // get token from URL (when opening new tabs + other users)
    const getTokenFromRoomCode = async (roomCode) => {
      try {
        const response = await fetch("http://localhost:3001/api/get-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode })
        });
    
        if (!response.ok) {
          throw new Error("Failed to fetch token");
        }
    
        const data = await response.json();

        // If data.token exists, set it
        if (data.token) {
          setToken(data.token);
        } else {
          console.error("Token is missing from response:", data);
        }
      } catch (error) {
        console.error("Error fetching token:", error);
      }
    };

    // update token if NO roomcode
    useEffect(() => {
      if (!token && roomCode) {
        getTokenFromRoomCode(roomCode);
      }
    }, [token, roomCode]);

    


    const setUserProfilePicture = async () => {
    
        if (token) {
          // Fetch profile picture
          const userProfile = await fetchUserProfile(token);
          if (userProfile && userProfile.profilePicture) {
            
            const profilePictureElement = document.getElementById('profile-picture');
            profilePictureElement.src = userProfile.profilePicture;
            profilePictureElement.style.display = 'block';
          }
        }
      };
      // make sure pfp displayed on mount & changes on refresh
      useEffect(() => {
        if (token) {
          setUserProfilePicture();
        }
      }, [token]);


    // current song playing
    const currentSong = async () => {
      if (!token) {
        console.error("Missing token");
        return;
      }
    
      const track = await fetchCurrentlyPlaying(token);
    
      if (!track) {
        console.log("No song currently playing");
        return;
      }
    
      setNowPlaying({
        name: track.name,
        artist: track.artist,
        album: track.album,
        cover: track.image
      });
    };
    
    // calls currentSong when song is mounted + whenever SONG changes 
    useEffect(() => {
      if (!token) return;

      currentSong(); // Immediately fetch once on mount
    
      const interval = setInterval(() => { // start polling every 5 seconds
        currentSong();
      }, 5000);
      return () => clearInterval(interval); // cleanup on unmount
    }, [token]);
        


    // skip
    const skipSong = async () => {
      if (!token) {
        console.error("Missing token");
        return;
      }
    
      await skipToNextTrack(token);
    };
    

    // skip back
    const skipBack = async () => {
      if (!token) {
        console.error("Missing token");
        return;
      }
    
      await skipToPreviousTrack(token);
    };
      
    // search/queue song
    const handleSearchChange = async (event) => {
      const query = event.target.value;
      setSearchQuery(query);
    
      if (query.length > 2) {
        const results = await searchSongs(token, query);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };

    // queue message
    const handleQueueSong = async (trackId, trackName) => {
      const trackUri = `spotify:track:${trackId}`;
      await queueSong(token, trackUri);
      setQueuedMessage(`🎵 Queued: ${trackName}`);
      setTimeout(() => setQueuedMessage(""), 3000);
    };
    

    // bar displaying time


    // logout event handler
    const handleLogout = async () => {
        const userId = localStorage.getItem("userId");
        localStorage.clear(); //regardless
        // delete whole document associated with userID from DB
        await fetch("http://localhost:3001/api/remove-session-and-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });        

        window.location.href = "/";
    }

    return (
        <>
        <h1 className="player-text">Player page</h1>

        <nav className="sidebar">
            <div className="profile-pic">
                {/* <img src={setUserProfilePicture} alt="Profile" /> */}
            </div>

            <ul className="sidebar-links">
                <li><Link to="/">🏠 Home</Link></li>
                <li><Link to="/search">🔍 Search</Link></li>
                <li><Link to="/settings">⚙️ Settings</Link></li>
            </ul>
        </nav>
        <Link to="/" onClick={handleLogout}>Log Out</Link>

        {nowPlaying && (
        <div className="now-playing">
            <img src={nowPlaying.cover} alt="Album cover" className="album-cover" />
            <h2>{nowPlaying.name}</h2>
            <p>{nowPlaying.artist} — <em>{nowPlaying.album}</em></p>
        </div>
        )}
        <button onClick={skipBack} className="skip-back">⏮️ Skip Back</button>
        <button onClick={skipSong} className="skip-forwards">⏭️ Skip Song</button>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search for a song..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />

          {searchResults.length > 0 && (
            <ul className="search-results">
              {searchResults.map((track) => (
                <li key={track.id} onClick={() => handleQueueSong(track.id, track.name)}>
                  <img src={track.image} alt={track.name} width="50" />
                  <span>{track.name} — {track.artist}</span>
                </li>
              ))}
            </ul>
          )}

          {queuedMessage && <p className="queue-msg">{queuedMessage}</p>}
        </div>

        <div className="profile">
            <img
              id="profile-picture"
              src=""
              alt="Profile Picture"
              style={{ display: 'none', borderRadius: '50%', width: '40px', height: '40px' }}
            />
        </div>

        {/*fix getting roomCode from search URl*/}
        {roomCode && (
              <div className="session-code">
                <h3>Your Session Code</h3>
                <p>{roomCode}</p>
              </div>
            )}
        </>
    );
}