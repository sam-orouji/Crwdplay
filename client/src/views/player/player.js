import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchCurrentlyPlaying, skipToNextTrack, skipToPreviousTrack, searchSongs, queueSong, fetchUserProfile, fetchPlaybackState } from "../../logic/playback";
import "./player.css";

export default function Player() {
    // variables
    const location = useLocation();
    const params = useParams(); // hooks must be called UNconditionally **used to get roomCode from the URL
    const [token, setToken] = useState(null);  // not passing in token: getting from roomCode (for new tabs + other users)
    const roomCode = params.roomCode; // getting roomCode from URL
    const navigate = useNavigate();

    const [nowPlaying, setNowPlaying] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [queuedMessage, setQueuedMessage] = useState("");
    const [guestNames, setGuestNames] = useState([]); // ** change to object to fetch other things in future for AI rec logic or doing things to their accounts/playlist

    

    // get token from URL (when opening new tabs + other users)
    const getTokenFromRoomCode = async (roomCode) => {
      // ONLY for guests who verified through login, so name is stored/max users
      const guestId = localStorage.getItem("guestId");
      const hostId = localStorage.getItem("hostId");
      const code = 1234;
      if (!guestId && !hostId) {
        navigate('/unauthorized'); // ** change later to a page that says, please authenticate --> and button to login
      }

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
        // only display for host
        const hostId = localStorage.getItem("hostId");

        if (token && hostId) {
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
    

    // guest in the session
    useEffect(() => {
      const fetchGuestNames = async () => {
        try {
          const roomCode = localStorage.getItem("roomCode");
          const response = await fetch("http://localhost:3001/api/get-guest-names", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomCode })
          });
    
          const data = await response.json();
          console.log("Fetched guest names:", data.names);
          setGuestNames(data.names || []);
        } catch (err) {
          console.error("Failed to fetch guest names:", err);
        }
      };
    
      fetchGuestNames();
      const interval = setInterval(fetchGuestNames, 5000);
      return () => clearInterval(interval);
    }, []);
    
    





    // logout event handler
    const handleLogout = async () => {
        const hostId = localStorage.getItem("hostId");
        const guestId = localStorage.getItem("guestId");
        const roomCode = localStorage.getItem("roomCode");
        // delete whole document associated with hostId from DB
        await fetch("http://localhost:3001/api/remove-session-and-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hostId })
        });        

        // if guest logging out
        await fetch("http://localhost:3001/api/remove-guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode, guestId })
        });

        localStorage.clear(); //regardless
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
        
        <div>
          <h3>Current Guests:</h3>
          {guestNames.length === 0 ? (
            <p>No guests yet...</p>
          ) : (
            guestNames.map((name, index) => <p key={index}>{name}</p>)
          )}
        </div>
        </>
    );
}