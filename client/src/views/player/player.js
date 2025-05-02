import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchCurrentlyPlaying, skipToNextTrack, skipToPreviousTrack, searchSongs, queueSong, 
          fetchUserProfile, fetchPlaybackState } from "../../logic/playback"; // PLAYBACK/UI FUNCTIONS
import {} from "../../logic/voting"; // VOTING FUNCTIONS 
import "./player.css";

export default function Player() {
    // ---------------------- PLAYBACK/UI LOGIC ----------------------
    const location = useLocation();
    const params = useParams(); // hooks must be called UNconditionally **used to get roomCode from the URL
    const [token, setToken] = useState(null);  // not passing in token: getting from roomCode (for new tabs + other users)
    const roomCode = params.roomCode; // getting roomCode from URL
    const navigate = useNavigate();

    const [searchResults, setSearchResults] = useState([]);
    const [queuedMessage, setQueuedMessage] = useState("");
    const [guestNames, setGuestNames] = useState([]); // -- change to object to fetch other things in future for AI rec logic or doing things to their accounts/playlist
    const [nowPlaying, setNowPlaying] = useState(null); // **song thats currently playing - polled every 5s
    const [searchQuery, setSearchQuery] = useState(""); // **not queueing rn


    // ---------------------- VOTING LOGIC ----------------------
    const [error, setError] = useState("");
    const [skip, setSkip] = useState(false); // did a user skip?
    const [topFiveSongs, setTopFiveSongs] = useState([]); // songId: "id1", title: "getLucky", votes "3" -- necesary to update jsx
    // const [lastTrackId, setLastTrackId] = useState(null); // trackId: to know when song changes ** we alr have nowPlaying -- ++ j check when this changes
    const [songQueue, setSongQueue] = useState(() => { // local var for state change + store in DB ** route NOT local storage
      const storedQueue = localStorage.getItem('songQueue');
      return storedQueue ? JSON.parse(storedQueue) : []; // if DNE return empty array
    });
    
    // update local storage everytime react variable updates, and stores in local storage (change to DB later) - page reload
        // Example songQueue structure:  (pass in songId to functions for queueing)
        // [{ songId: "2Foc5Q5nqNiosCNqttzHof", 
        // title: "Get Lucky (Radio Edit) [feat. Pharrell Williams and Nile Rodgers]", 
        // votes: 0 }, ...]
    useEffect(() => {
      localStorage.setItem('songQueue', JSON.stringify(songQueue));
    }, [songQueue]);
  

    


    // ---------- PHASE 1 ------ display queues (only 1 queue wins. voting period after song changes --> populate songs)


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
          setQueuedMessage("You’ve already queued a song this round!");
          setTimeout(() => setQueuedMessage(""), 3000);
          return;
        }
    
        // 1. Check if song is already in queue
        const res = await fetch(`http://localhost:3001/api/is-song-in-queue?roomCode=${roomCode}&songId=${trackId}`);
        const data = await res.json();
    
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
            image: trackImage
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
        const newQueue = [...songQueue, { songId: trackId, title: trackName, votes: 0, image: trackImage }];
        setSongQueue(newQueue);
        setQueuedMessage(`🎵 Queued: ${trackName}`);
        setTimeout(() => setQueuedMessage(""), 3000);
    
      } catch (error) {
        console.error("Error queueing song:", error);
        setQueuedMessage("Error queueing song. Please try again.");
        setTimeout(() => setQueuedMessage(""), 3000);
      }
    };
    

    // getSongs: gets ALL songs in queue --> then stores top 5 votes - stable sort lol. ** reuse this for winner logic just return topFiveSongs[0]
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
        console.log("Top 5 songs selected:", topFive); // debug statement
      } catch (err) {
        console.error("Error fetching top songs:", err);
      }
    };
      

    // current song playing -- important variable for resetting logic once songs change
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

    // POLLER: gets current song, top 5 voted songs, guest names, more to come (when mounted + every 5s) 
    useEffect(() => {
      if (!token) return;

      currentSong(); // Immediately fetch once on mount
    
      const interval = setInterval(() => { // start polling every 5 seconds for every function needing repeated checking
        currentSong();
        getSongs(); // updates top 5 songs by votes!
        fetchGuestNames();
      }, 5000);
      return () => clearInterval(interval); // cleanup on unmount
    }, [token]);





    // ---------- PHASE 2: VOTING/SKIPPING ----------
    
    // clicking on album cover is THIS handler-> pass in this handler to the return statement below code
    const voteForSong = (songId) => {
      // can't vote twice
    };
    // whenever song changes (song skips || song ends)
    // 1. play arr[0] of songs THEN whipe that list of top 5 songs. 2. reset votes/queues/skips
        // auto reset votes, and WIPE queue ++
    //  **Call this on the winner:await queueSong(token, trackUri); ** this ACTUALLY queues the song -- PROB CHANGE THIS TO a PLAY SONG ROUTE
 



    // ** DONT actually skip. only skip if majority skipped
    // 1. update total skips 2. compare to number of guests/majority if so, call await skipToNextTrack(token)
    const skipSong = async () => {
      // majority wins
      // ROUTE FOR GETUSERS. get length and GET integer of GETVOTES 
      // reset skip to false after song ends -- hook
                
      if (!token) {
        console.error("Missing token");
        return;
      }

      if (skip) {
        return; // user cannot try to skip if they already skipped
      }
    
      await skipToNextTrack(token);
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
              <img
                id="profile-picture"
                src=""
                alt="Profile Picture"
                style={{ display: 'none', borderRadius: '50%', width: '40px', height: '40px' }}
              />
            </div>

            <ul className="sidebar-links">
                <li><Link to="/">🏠 Home</Link></li>
                <li><Link to="/voting">🗳️ Voting</Link></li>
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
              {/*error messages OR popups*/}
              {error && <p className="error-message" style={{ color: "red" }}>{error}</p>}
              
              <div className="top-songs">
                <h3>Top 5 Songs</h3>
                {topFiveSongs.length === 0 ? (
                  <p>No songs in queue yet.</p>
                ) : (
                  <ol className="top-five-list">
                    {topFiveSongs.map((song, index) => (
                      <li key={song.songId} className={index === 0 ? "winner" : ""}>
                        <div className="song-entry">
                          {song.image && (
                            <img src={song.image} alt={song.name} className="album-thumbnail" />
                          )}
                          <p>
                            <strong>{index === 0 ? "🎉 " : ""}{song.name || "Untitled"}</strong>
                            {" — "}{song.votes} vote{song.votes !== 1 && "s"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div> {/* top 5 songs */}
            </div>

            {/* session code, guest names, search/queue songs */}
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

                {queuedMessage && <p className="queue-msg">{queuedMessage}</p>}
              </div> {/* search container*/}
                
            </div> {/* right panel*/}
          </div>


        </div> {/* all content*/}

      </>
    );
}