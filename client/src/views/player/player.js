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
    const [vote, setVote] = useState(true); // one vote & one queue only
    const [queued, setQueued] = useState(true);
    const [skip, setSkip] = useState(false);
    const [songQueue, setSongQueue] = useState(() => {
      // array initialized here, ++ create and set array to +1 when voting or queuing - vote edit value and add 1 
      // Initialize from localStorage if it exists - if not return empty array
      const storedQueue = localStorage.getItem('songQueue');
      return storedQueue ? JSON.parse(storedQueue) : []; 
    });
    // update local storage everytime react variable updates, and stores in local storage (change to DB later) - page reload
    useEffect(() => {
      localStorage.setItem('songQueue', JSON.stringify(songQueue));
    }, [songQueue]); // ++ check if i can pass in song title to queue/the format aligns properly when testing/passing into fxns
    // Example songQueue structure: 
        // [{ songId: "abc123", 
        // title: "Song Name", 
        // votes: 2 }, ...]


    // getSongs: function to get top 5 songs in queue: display the album covers on screen with number of votes under (these 2 functions go hand in hand)
    // poll this every 5 seconds
    const getSongs = () => {
      // for loop, for each display in a grid the album covers.
      // make this a div in the return statement, but on each item put a handler {voteForSong} on top of the icon
    }

    // voteForSong: voting icon is the album covers -- populate top 5 songs. (polling is HTTP issue not API token -- research)
    const voteForSong = (songId) => {
      // only 1 vote -- binds
      if (vote) {
        return;
        // put display message flash in middle of screen
      }

      // loop through song array, if find item we vote for 
      // const newQueue = songQueue.map((s) => {
      //   if (s.songId === songId) {
      //     return { ...s, votes: s.votes + 1 };
      //   }
      //   return s;
      // });
    
      // setSongQueue(newQueue);
      // setVote(true);
    }

    // startVotePeriod: 15 seconds in song. (make sure song is longer than 15 lol) 
    const startVotePeriod = () => {
      // put display message onto screen, 
      // change vote/queue to be true originally, once 15s hits turn both to false
      // make sure all these functions run when song changes -- ** make hooks for them
    }

    const getSongLength = () => {
      // get song length
      // calculate the time in ms, 10 seconds before end
      // return that value
      // ** should these be async functions? no arg for these ik
    }
    const getWinningSong = () => {
      // loop through songQueue array
      // set a var called winner, if votes are higher it swaps (preserves older songs to become winners)
      // queue winner 10 seconds before end, maybe swap to like 5
      // reset voting/queue priveledge when new song hits
    }

  // skip ++ make huge button in center
  const skipSong = async () => {
    // skip only allowed during voting period
    // reset skip to false after song ends -- hook
    // this might j be easier to make a route for # of guests/a skip int you +1 if someone skips.
      // skip if skips > guest / 2 (majority) -- NAH just make a variable for votes - array we update? or int possible? 
                                              // -alr have array of guestNames, just do .size
    if (!token) {
      console.error("Missing token");
      return;
    }
  
    await skipToNextTrack(token);
  };
          


    

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
    

    // skip back -- delete later ig
    const skipBack = async () => {
      if (!token) {
        console.error("Missing token");
        return;
      }
    
      await skipToPreviousTrack(token);
    };
      
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

    // queue message ++
    const handleQueueSong = async (trackId, trackName) => {
      // one queue per guest
      if (queued) {
        setQueuedMessage("Can only queue one song per vote period!");
        return;
      }

      const trackUri = `spotify:track:${trackId}`;
      await queueSong(token, trackUri);

      // voting logic ++ -- add queued song to list, with +1 vote
      // const newQueue = [...songQueue, { songId: song.id, title: song.title, votes: 1 }];
      // setSongQueue(newQueue);
      // setQueued(true);

      // display message
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
                <li><Link to="/voting">🗳️ Voting</Link></li>
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