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


    // voting logic
    const [error, setError] = useState("");
    const [vote, setVote] = useState(false); // one vote & one queue only
    const [queued, setQueued] = useState(false); // did a user try to queue?
    const [skip, setSkip] = useState(false); // did a user skip?
    const [skipCount, setSkipCount] = useState(0);
    const [songVotes, setSongVotes] = useState([]); // songId: "id1", votes: 2
    const [topFiveSongs, setTopFiveSongs] = useState([]); // songId: "id1", title: "getLucky", votes "3"
    const [lastTrackId, setLastTrackId] = useState(null); // trackId: to know when song changes
    const [songQueue, setSongQueue] = useState(() => { // local var for state change + store in DB
      const storedQueue = localStorage.getItem('songQueue');
      return storedQueue ? JSON.parse(storedQueue) : []; // if DNE return empty array
    });
    
    // update local storage everytime react variable updates, and stores in local storage (change to DB later) - page reload
    useEffect(() => {
      localStorage.setItem('songQueue', JSON.stringify(songQueue));
    }, [songQueue]); // updates localstorage everytime songQueue var updates
  
    // Example songQueue structure:  (pass in songId to functions for queueing)
        // [{ songId: "2Foc5Q5nqNiosCNqttzHof", 
        // title: "Get Lucky (Radio Edit) [feat. Pharrell Williams and Nile Rodgers]", 
        // votes: 0 }, ...]



    // getSongs: function to get top 5 songs in queue: display the album covers on screen with number of votes under
    // handler onClick = vote
    const getSongs = () => {
    }


    // voteForSong: the handler mentioned above^^
    const voteForSong = (songId) => {
      // can't vote twice
    };
    // whenever song changes (song skips || song ends)
        // auto reset votes, and queue WHIPE it
    useEffect(() => {
      const votesArray = songQueue.map((song) => ({
        songId: song.songId,
        votes: song.votes,
      }));
      setSongVotes(votesArray);
    }, [songQueue]);

    // whenever votes/queue changes --> update 5 songs (if not 5 populate them), update allocated votes

    
    
    // queue songs
    const handleQueueSong = async (trackId, trackName) => {
      // one queue per guest
      if (queued) {
        setQueuedMessage("Can only queue one song per vote period!");
        return;
      }

      // Check if song is already in queue --> iterate the DB using a route for GETQUEUE

      // queue logic
      try {
        const trackUri = `spotify:track:${trackId}`;
        // DONT actually queue if not in queue, add to array queue then getWinningSong actually queues
        // await queueSong(token, trackUri); //backend api call

        // Add queued song to songQueue state
        const newQueue = [...songQueue, { songId: trackId, title: trackName, votes: 0 }];
        setSongQueue(newQueue);

        // Mark user as queued
        setQueued(true);

        // display message
        setQueuedMessage(`🎵 Queued: ${trackName}`);
        setTimeout(() => setQueuedMessage(""), 3000);
      } catch (error) {
        console.error("Error queueing song:", error);
        setQueuedMessage("Error queueing song. Please try again.");
        setTimeout(() => setQueuedMessage(""), 3000);
      }
    };



    const getWinningSong = () => {
      // loop through songQueue array in DB - GETQUEUE ROUTE
      // set a var called winner, if votes are higher it swaps (preserves older songs to become winners)
      // call this when SONG CHANGES
      // this ACTUALLY queues the winner, unlike handleQueue song adds to our queue in the DB
    }

    // skip
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
          

        // current song playing ** use for voting pictures / when songs change LOGIC
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
    
          const currentTrackId = track.id;
    
          // // Detect if track changed
          // if (lastTrackId && lastTrackId !== currentTrackId) {
          //   console.log("Detected song end! Removing first song from queue...");
          //   songChange(); // remove top song from queue
          //   setVote(false); // reset voting
          //   setQueued(false); // reset queueing
          //   setSkip(false); // reset skipping
          //   setTopFiveSongs([]); // wipe top 5 songs
          // }
    
          // setLastTrackId(currentTrackId); // Always update lastTrackId      
        
          setNowPlaying({
            name: track.name,
            artist: track.artist,
            album: track.album,
            cover: track.image
          });
        };
        // // poll if song changes every 5 seconds ++
        // useEffect(() => {
        //   if (!token) return;
        
        //   currentSong(); // Fetch immediately
        
        //   const interval = setInterval(() => {
        //     currentSong(); // Fetch every 5 sec
        //   }, 5000);
        
        //   return () => clearInterval(interval);
        // }, [token]);

    







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

    
    
    
    
    // calls currentSong when song is mounted + whenever SONG changes 
    useEffect(() => {
      if (!token) return;

      currentSong(); // Immediately fetch once on mount
    
      const interval = setInterval(() => { // start polling every 5 seconds
        currentSong();
      }, 5000);
      return () => clearInterval(interval); // cleanup on unmount
    }, [token]);
    
      
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
        {/*error messages OR popups*/}
        {error && <p className="error-message" style={{ color: "red" }}>{error}</p>}

        
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
              <p>voting screen</p>
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
                      <li key={track.id} onClick={() => handleQueueSong(track.id, track.name)}>
                        <img src={track.image} alt={track.name} width="50" />
                        <span>{track.name} — {track.artist}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {queuedMessage && <p className="queue-msg">{queuedMessage}</p>}
              </div> {/* search container*/}
                
            </div> {/* left panel*/}
          </div>


        </div> {/* all content*/}

      </>
    );
}