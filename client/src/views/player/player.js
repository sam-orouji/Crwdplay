import { Link, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchCurrentlyPlaying, skipToNextTrack, searchSongs, queueSong, fetchUserProfile, fetchPlaybackState } from "../../logic/playback";
import "./player.css";

export default function Player() {
    // variables
    const location = useLocation();
    const params = useParams(); // hooks must be called UNconditionally **used to get roomCode from the URL
    const token = location.state?.token;
    const roomCode = params.roomCode; // getting roomCode from URL

    const [nowPlaying, setNowPlaying] = useState(null);


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
      
        try {
          const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
      
          if (res.status === 204) {
            console.log("No song currently playing");
            return;
          }
      
          const data = await res.json();
      
          const track = data.item;
          const albumCover = track.album.images[0]?.url;
          const albumName = track.album.name;
          const artistName = track.artists.map(artist => artist.name).join(", ");
          const songName = track.name;

          setNowPlaying({
            name: track.name,
            artist: artistName,
            album: albumName,
            cover: albumCover
          });
      
          // update UI here if needed
        } catch (err) {
          console.error("Error fetching current song:", err);
        }
      };
    // calls currentSong when song is mounted + whenever SONG changes 
    useEffect(() => {
        if (token) {
          currentSong();
        }
    }, [nowPlaying]);


    // skip
    const skipSong = async () => {
        if (!token) {
          console.error("Missing token");
          return;
        }
      
        try {
          const res = await fetch("https://api.spotify.com/v1/me/player/next", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
      
          if (res.status === 204) {
            console.log("✅ Song skipped successfully");
          } else {
            const error = await res.json();
            console.error("❌ Failed to skip:", error);
          }
        } catch (err) {
          console.error("Error skipping song:", err);
        }
      };

    // skip back
    const skipBack = async () => {
        if (!token) {
          console.error("Missing token");
          return;
        }
      
        try {
          const res = await fetch("https://api.spotify.com/v1/me/player/previous", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
      
          if (res.status === 204) {
            console.log("✅ Song skipped successfully");
          } else {
            const error = await res.json();
            console.error("❌ Failed to skip:", error);
          }
        } catch (err) {
          console.error("Error skipping song:", err);
        }
      };
      
    // search/queue song

    // bar displaying time


    // logout event handler
    const handleLogout = async () => {
        const userId = localStorage.getItem("userId");
        if (userId) {
            localStorage.removeItem("userId");
        }
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