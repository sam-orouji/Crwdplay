import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { fetchCurrentlyPlaying, queueSong, skipToNextTrack, searchSongs, 
          fetchUserProfile } from "../../logic/playback"; // PLAYBACK/UI FUNCTIONS
import {} from "../../logic/voting"; // VOTING FUNCTIONS 
import "./player.css";

export default function Player() {
    // ---------------------- PLAYBACK/UI LOGIC ----------------------
    const location = useLocation();
    const params = useParams(); // hooks must be called UNconditionally **used to get roomCode from the URL
    const [token, setToken] = useState(null);  // not passing in token: getting from roomCode (for new tabs + other users)
    const roomCode = params.roomCode; // getting roomCode from URL
    const navigate = useNavigate();
    const [userProfileUrl, setUserProfileUrl] = useState(null);

    const [searchResults, setSearchResults] = useState([]);
    const [queuedMessage, setQueuedMessage] = useState("");
    const [guestNames, setGuestNames] = useState([]); // -- change to object to fetch other things in future for AI rec logic or doing things to their accounts/playlist
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState("");


    // ---------------------- VOTING LOGIC ----------------------
    const [nowPlaying, setNowPlaying] = useState(null); // Initialize as null
    const previousTrackUri = useRef(null); // previous song
    const songEndTimeoutId = useRef(null); // Store timeout ID for cleanup
    const [topFiveSongs, setTopFiveSongs] = useState([]); // necessary to update top 5 songs on screen
    const [songQueue, setSongQueue] = useState(() => { // local var for state change + store in DB ** route NOT local storage
      const storedQueue = localStorage.getItem('songQueue');
      return storedQueue ? JSON.parse(storedQueue) : []; // if DNE return empty array
    });

    // queue songs (not actually queing on hosts account, adds to songQueue to vote from top 5)
    // trackID & name is passed into this from search bars results/when clicked through prop handler
    const handleQueueSong = async (trackId, trackName, trackImage) => {
      try {
        const isHost = localStorage.getItem("hostId") !== null;
        const guestId = localStorage.getItem("guestId");
    
        // 0. Check if user has already queued (via DB, not React state)
        const votedRes = await fetch(`http://localhost:3001/api/get-user-state?roomCode=${roomCode}&isHost=${isHost}${!isHost ? `&userId=${guestId}` : ""}`);
        const votedData = await votedRes.json();
    
        if (votedData.queued) {
          setQueuedMessage("You've already queued a song this round!");
          setTimeout(() => setQueuedMessage(""), 3000);
          return;
        }
    
        // 1. Check if song is already in queue
        const res = await fetch(`http://localhost:3001/api/is-song-in-queue?roomCode=${roomCode}&songId=${trackId}`);
        const data = await res.json();
        const trackUri = `spotify:track:${trackId}`; // so hook can ACTUALLY play song when song changes**
    
        if (data.exists) {
          setQueuedMessage("Song is already in the queue!");
          setTimeout(() => setQueuedMessage(""), 3000);
          return;
        }
    
        // 2. Add song to queue in DB
        await fetch("http://localhost:3001/api/add-song-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode,
            songId: trackId,
            name: trackName,
            votes: 0,
            image: trackImage,
            uri: trackUri
          }),
        });
    
        // 3. Update user state in DB to mark as queued
        await fetch("http://localhost:3001/api/set-user-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode,
            isHost,
            userId: isHost ? null : guestId,
            type: "queued",
            value: true
          }),
        });
    
        // 4. Update local state (optional, for instant UI feedback)
        const newQueue = [...songQueue, { songId: trackId, title: trackName, votes: 0, image: trackImage, uri: trackUri }];
        setSongQueue(newQueue);
        setQueuedMessage(`🎵 Queued: ${trackName}`);
        setTimeout(() => setQueuedMessage(""), 3000);
    
      } catch (error) {
        console.error("Error queueing song:", error);
        setQueuedMessage("Error queueing song. Please try again.");
        setTimeout(() => setQueuedMessage(""), 3000);
      }
    };
    

    // getSongs: gets ALL songs in queue --> then stores top 5 votes - like a stable sort lol
    const getSongs = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/get-song-queue?roomCode=${roomCode}`);
        const data = await response.json();
    
        if (!response.ok || !data.songQueue) {
          console.error("Failed to fetch song queue");
          return;
        }
    
        const queue = data.songQueue;
    
        // O(5n) selection: pick top 5 by votes, breaking ties by original order
        const topFive = [];
        const pickedIndexes = new Set();
    
        for (let i = 0; i < 5 && i < queue.length; i++) {
          let maxVotes = -1;
          let winnerIndex = -1;
    
          for (let j = 0; j < queue.length; j++) {
            if (pickedIndexes.has(j)) continue;
    
            const song = queue[j];
            if (song.votes > maxVotes) {
              maxVotes = song.votes;
              winnerIndex = j;
            }
          }
    
          if (winnerIndex !== -1) {
            topFive.push(queue[winnerIndex]);
            pickedIndexes.add(winnerIndex);
          }
        }
    
        setTopFiveSongs(topFive); // updates UI state
        console.log("Top 5 songs updated:", topFive);
      } catch (err) {
        console.error("Error fetching top songs:", err);
      }
    };

    // function to calculate time remaining in current song and schedule next song
    const scheduleNextSong = async () => {
      if (!token) return;
    
      try {
        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
    
        if (!response.ok) {
          console.error("Error fetching current playback:", response.status);
          return;
        }
    
        const data = await response.json();
    
        if (data && data.item) {
          const totalDuration = data.item.duration_ms;
          const progress = data.progress_ms;
          const timeRemaining = totalDuration - progress;
          const offset = 5000; // 5 seconds in ms
          
          // Time until we should queue the next song (5 seconds before end)
          const timeUntilQueue = Math.max(0, timeRemaining - offset);
          
          console.log(`⏱️ Current song: ${timeRemaining}ms remaining, will trigger in ${timeUntilQueue}ms`);
          
          // Clear any existing timeout
          if (songEndTimeoutId.current) {
            clearTimeout(songEndTimeoutId.current);
          }
          
          // Set new timeout to queue next song
          songEndTimeoutId.current = setTimeout(() => {
            console.log("🎵 Time to queue next song!");
            playNextSong();
          }, timeUntilQueue);
        }
      } catch (err) {
        console.error("Error scheduling next song:", err);
      }
    };
    
    // Play the next song (winning song from votes)
  // Play the next song (winning song from votes)
  const playNextSong = async () => {
    try {
      // Fetch songs directly from DB instead of relying on state
      const response = await fetch(`http://localhost:3001/api/get-song-queue?roomCode=${roomCode}`);
      const data = await response.json();
      
      if (!response.ok || !data.songQueue || data.songQueue.length === 0) {
        console.warn("No songs in queue to play next");
        return;
      }
      
      // Sort the songs by votes
      const songQueue = data.songQueue;
      songQueue.sort((a, b) => b.votes - a.votes);
      
      const winner = songQueue[0]; // top-voted song
      console.log("🏆 Playing winner:", winner.name, "with", winner.votes, "votes");
      
      const hostId = localStorage.getItem("hostId");
      const guestId = localStorage.getItem("guestId");
      const isHost = !!hostId;
      
      // 1. Queue the winning song
      if (hostId && token) {
        console.log("Queueing song:", winner.uri);
        await queueSong(token, winner.uri);
        
        // Short delay before skipping to ensure queue request completes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Skip to the next track (the one we just queued)
        await skipToNextTrack(token);
        console.log("Skipped to queued song");
      }
      
      // 2. Clear the song queue in DB
      await fetch("http://localhost:3001/api/clear-song-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode }),
      });
      
      // 3. Reset user voting & queue states
      const resetTypes = ["queued", "voted"];
      for (const type of resetTypes) {
        await fetch("http://localhost:3001/api/set-user-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode,
            isHost,
            userId: isHost ? null : guestId,
            type,
            value: false,
          }),
        });
      }
      
      // 4. Update the UI
      await getSongs();
      
      console.log("✅ Winner played & state reset successfully");
    } catch (err) {
      console.error("❌ Error playing next song:", err);
    }
  };

    // current song playing -- important variable for resetting logic once songs change
    const currentSong = async () => {
      if (!token) {
        console.error("Missing token");
        return;
      }
    
      try {
        const track = await fetchCurrentlyPlaying(token);
        
        if (track) {
          setNowPlaying({
            name: track.name,
            artist: track.artist,
            album: track.album,
            cover: track.image,
            uri: track.uri
          });
        }
      } catch (error) {
        console.error("Error fetching current song:", error);
      }
    };

    // POLLER: gets current song, top 5 voted songs, guest names, more to come (when mounted + every 5s) 
    useEffect(() => {
      if (!token) return;

      // Initial fetch of data
      const initialFetch = async () => {
        await currentSong();
        await getSongs();
        await fetchGuestNames();
        await scheduleNextSong(); // Schedule the next song immediately
      };
      
      initialFetch();
    
      // Set up polling interval
      const interval = setInterval(() => {
        currentSong();
        getSongs();
        fetchGuestNames();
      }, 10000);
      
      return () => {
        clearInterval(interval);
        // Clean up any pending timeouts
        if (songEndTimeoutId.current) {
          clearTimeout(songEndTimeoutId.current);
        }
      };
    }, [token]);

    // When current song changes, schedule the next song
    useEffect(() => {
      if (!nowPlaying || !token) return;
      
      // If the song has changed
      if (nowPlaying.uri !== previousTrackUri.current) {
        console.log("🔄 Song changed to:", nowPlaying.name);
        previousTrackUri.current = nowPlaying.uri;
        
        // Calculate when to queue the next song
        scheduleNextSong();
      }
    }, [nowPlaying, token]);
    
    // handler for clicking on album cover to vote!
    const voteForSong = async (songId, songName, currentVotes) => {
      const isHost = localStorage.getItem("hostId") !== null;
      const guestId = localStorage.getItem("guestId");
    
      try {
        // 1. Check if user already voted (via DB)
        const res = await fetch(`http://localhost:3001/api/get-user-state?roomCode=${roomCode}&isHost=${isHost}${!isHost ? `&userId=${guestId}` : ""}`);
        const stateData = await res.json();
    
        if (stateData.voted) {
          setError("You've already voted this round!");
          setTimeout(() => setError(""), 3000);
          return;
        }
    
        // 2. Call vote route to increment vote count
        await fetch("http://localhost:3001/api/update-song-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode,
            songId,
            name: songName,
            votes: currentVotes + 1
          }),
        });
    
        // 3. Mark user as voted
        await fetch("http://localhost:3001/api/set-user-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode,
            isHost,
            userId: isHost ? null : guestId,
            type: "voted",
            value: true
          }),
        });
    
        setError("✅ Vote registered!");
        setTimeout(() => setError(""), 3000);
        
        // Refresh the song list to show updated votes
        getSongs();
      } catch (err) {
        console.error("Error voting for song:", err);
        setError("Error voting. Try again.");
        setTimeout(() => setError(""), 3000);
      }
    };

    // Skip function for manual skipping
    const skipSong = async () => {
      if (!token) {
        console.error("Missing token");
        return;
      }
    
      await skipToNextTrack(token);
      
      // Re-schedule the next song
      setTimeout(() => {
        currentSong();
        scheduleNextSong();
      }, 1000);
    };
    
      
    


    


    

    // ---------------------- PLAYBACK/UI LOGIC ----------------------

    // get token from URL (when opening new tabs + other users)
    const getTokenFromRoomCode = async (roomCode) => {
      // ONLY for guests who verified through login, so name is stored/max users
      const guestId = localStorage.getItem("guestId");
      const hostId = localStorage.getItem("hostId");
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

    // search/queue song 
    const handleSearchChange = async (event) => {
      // only one queue per person -- until voting period ends ++

      const query = event.target.value; // what user types
      setSearchQuery(query);
    
      if (query.length > 2) {
        const results = await searchSongs(token, query); // fxn
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };
    
    // profile pic
    const setUserProfilePicture = async () => {
      const hostId = localStorage.getItem("hostId");
      if (token && hostId) {
        const userProfile = await fetchUserProfile(token);
        if (userProfile && userProfile.profilePicture) {
          setUserProfileUrl(userProfile.profilePicture); // ✅ set state, not DOM
        }
      }
    };
    
    // make sure pfp displayed on mount & changes on refresh
    useEffect(() => {
      if (token) {
        setUserProfilePicture();
      }
    }, [token]);

    
    const fetchGuestNames = async () => {
      try {
        const roomCode = localStorage.getItem("roomCode");
        const response = await fetch("http://localhost:3001/api/get-guest-names", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode })
        });
  
        const data = await response.json();
        // console.log("Fetched guest names:", data.names);
        setGuestNames(data.names || []);
      } catch (err) {
        console.error("Failed to fetch guest names:", err);
      }
    };

    

    // logout event handler
    const handleLogout = async () => {
      const hostId = localStorage.getItem("hostId");
      const guestId = localStorage.getItem("guestId");
      const roomCode = localStorage.getItem("roomCode");
      // delete whole document associated with hostId from DB
      if (hostId) {
        await fetch("http://localhost:3001/api/remove-session-and-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostId })
      }); 
      }
     
      if (guestId) {
        // if guest logging out
        await fetch("http://localhost:3001/api/remove-guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode, guestId })
        });
      }

      localStorage.clear(); //regardless
      window.location.href = "/";
  }


    return (
      <> 
        <nav className="sidebar">
            <div className="profile-pic">
              {userProfileUrl && (
                <img
                  src={userProfileUrl}
                  alt="Profile Picture"
                  style={{ borderRadius: '50%', width: '40px', height: '40px' }}
                />
              )}
            </div>

            <ul className="sidebar-links">
                <li><Link to="/">🏠 Home</Link></li>
                {/*<li><Link to="/voting">🗳️ Voting</Link></li>*/}
                <li><Link to="/" onClick={handleLogout}>Log Out</Link></li>
            </ul>
        </nav>
      

        {/* when screen gets small: left on top of right */}
        <div className="all-content">
          {/* current song - main show*/}
          <div className="top-panel">
            {nowPlaying && (
              <div className="now-playing">
                  <img src={nowPlaying.cover} alt="Album cover" className="album-cover" />
                  <h2>{nowPlaying.name}</h2>
                  <p>{nowPlaying.artist} — <em>{nowPlaying.album}</em></p>
              </div>
            )}
          </div>


          {/* voting screen */}
          <div className="bottom-panels">
            <div className="left-panel">

              {/*voting error messages*/}
              <div className="vote-msg-wrapper">
                {error && (
                  <p className={`vote-msg visible ${error.startsWith("✅") ? "success" : "error"}`}>
                    {error}
                  </p>
                )}
              </div>

              {/* Top Songs Display */}
              <div className="top-songs">
                <h3>Top Songs</h3>
                
                {topFiveSongs.length === 0 ? (
                  <div className="empty-queue">
                    <p>No songs in queue yet. Be the first to add one!</p>
                  </div>
                ) : (
                  <ol className="song-grid">
                    {topFiveSongs.map((song, index) => (
                      <li 
                        key={song.songId} 
                        className={`song-card ${index === 0 ? "winner" : ""}`}
                        onClick={() => voteForSong(song.songId, song.name, song.votes)}
                      >
                        {index === 0 && <div className="winner-badge">🏆</div>}
                        
                        <div className="album-cover-container">
                          {index < 5 && <div className="rank-indicator">{index + 1}</div>}
                          {song.image && (
                            <img
                              src={song.image}
                              alt={song.name}
                              className="voting-album-cover"
                            />
                          )}
                        </div>
                        
                        <div className="song-info">
                          <h4 className="song-name">{song.name || "Untitled"}</h4>
                          <div className="vote-count">{song.votes}</div>
                          <div className="vote-label">vote{song.votes !== 1 && "s"}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div> {/* End top songs */}

            </div>

            {/* session code, guest names, search/queue songs, queueing messages */}
            <div className="right-panel">
              {roomCode && (
                  <div className="session-code">
                    <h3>Session Code</h3>
                    <p>{roomCode}</p>
                  </div>
              )}

              <div className="current-guests">
                <h3>Guests:</h3>
                {guestNames.length === 0 ? (
                  <p>No guests yet...</p>
                ) : (
                  guestNames.map((name, index) => <p key={index}>{name}</p>)
                )}
              </div>

              {/* error queueing message */}
              <div className="queue-msg-wrapper">
                {queuedMessage && (
                  <p
                    className={`queue-msg visible ${queuedMessage.startsWith("🎵") ? "success" : "error"}`}
                  >
                    {queuedMessage}
                  </p>
                )}
              </div>


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
                      <li key={track.id} onClick={() => handleQueueSong(track.id, track.name, track.image)}> {/* Pass in to queue logic!!*/}
                        <img src={track.image} alt={track.name} width="50" />
                        <span>{track.name} — {track.artist}</span>
                      </li>
                    ))}
                  </ul>
                )}

              </div> {/* search container*/}
                
            </div> {/* right panel*/}
          </div>


        </div> {/* all content*/}

      </>
    );
}