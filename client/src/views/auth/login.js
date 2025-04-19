// login is also the redirect URI because I want to seperate authenticating logic here
// (if user has a token --> then redirect to /player) keep player as just UI and player requesting logic
import "./login.css";
import { loginEndpoint} from "./auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState} from "react";
import { v4 as uuidv4 } from 'uuid';

export default function Login() {
    const navigate = useNavigate();
    const [inputCode, setInputCode] = useState(""); // "" to avoid annoying NPEs
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    // extract token from URL after auth -- write in DB
    // wrote extractTokenFromUrl & handleAuth functions INSIDE the hook bc the scope only pertains to logging in

    // HAD issues here whether setting var states IN scope/passing them correctly to player 
    // (solution: didn't declare state variables, just used useNavigate and passed in local roomCode + 
    // token variables BC navigating link inside an async function would happen BEFORE the state for 
    // variables wouold update - there's no NEED to even have variables if we use useNavigate )
    useEffect(() => {
        const extractTokenFromUrl = () => {
          const hash = window.location.hash;
          if (!hash) return null;
    
          const params = new URLSearchParams(hash.substring(1));
          const token = params.get("access_token");
    
          if (token) {
            window.history.replaceState(null, null, window.location.pathname);
          }
    
          return token;
        };
    
        const handleAuth = async () => {
          const token = extractTokenFromUrl();
          if (!token) return;
        
          // set hostId in local storage (one variable to associate host with rest in the DB: token & session code)
          const hostId = await genUserId(token);
          const code = genRoomCode();
          localStorage.setItem("hostId", hostId);
          localStorage.setItem("roomCode", code); // ✅ bc state doesn't update in time to redirect to proper route IF user signed in
          
          // store token + hostId + sessionCode in mongoDB
          await fetch("http://localhost:3001/api/store-session-and-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hostId, sessionCode: code, token })
          });
    
          // redirect now if token & everything is ready:
          if (token) {
            // ** navigate is happening before I could update roomCodes state, bc this is INSIDE an async function 
            // ** so roomCode ISNT being sent to player
            navigate(`/player/${code}`);
          }
        };
    
        handleAuth();
      }, []);

    // generate a hostId based off the token (sha256 hashing)
    async function genUserId(token) {
        if (!token) throw new Error("Token is required to generate hostId");
      
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        return hashHex;
      }

    // gen guestId
    function genGuestId() {
      return `guest_${uuidv4()}`;
    }


    function genRoomCode() {
        return Math.floor(10000 + Math.random() * 90000).toString();
    }

    // session Handler - when clicking button redirect to spotify auth
    const sessionHandler = () => {
      const hostId = localStorage.getItem("hostId");
      if (hostId) {
        // User already authenticated → navigate to the player (and send in roomCode bc GEN whenever this button is hit) **
        // token has ANOTHER navigate link bc the token is GRABBED from handleAuth function inside the hook above
        // AFTER this button it hit --> spotify oauth
        const storedRoomCode = localStorage.getItem("roomCode");
        navigate(`/player/${storedRoomCode}`);
      } else {
        window.location.href = loginEndpoint;
      }
    }


    // users entering session Code
    const handleJoinSession = async (inputCode) => {
      // hosts CANT join other sessions
      if (localStorage.getItem("hostId")) {
        setError("Hosts cannot join other sessions.");
        return;
      }

      if (localStorage.getItem("guestId")) {
        setError("logged in guests cannot join multiple times.")
        return;
      }

      try {
        const response = await fetch("http://localhost:3001/api/validate-room-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode: inputCode })
        });
    
        const data = await response.json();

        if (!response.ok || !data.exists) {
          throw new Error("Room code does NOT exist");
        }

        // gen guestId: write in DB and store in localstorage (so 1 person can't make multiple users)
        const guestId = genGuestId();
        localStorage.setItem("guestId", guestId);

        // add name to DB ONLY if code exists
        const writeName = await fetch("http://localhost:3001/api/update-guests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            roomCode: inputCode, 
            guestId,
            name
          }) // ✅ CORRECT
        })


        console.log({ roomCode: inputCode, guestId, name });

        if (!writeName.ok) {
          throw new Error("Failed to add guest to the list");
        }
    
        // FINALLY, If roomCode exists, redirect
        navigate(`/player/${inputCode}`);
      } catch (error) {
        console.error("Error validating RoomCode:", error);
        setError(error.message);
      }
    };
    


   return(
      <>
        <h1 class="login-title">Join or Create a Session</h1>
        <button className="create-session-button" onClick={sessionHandler}>Create a Session 🎶</button>
        <div class>

        <form onSubmit={(e) => {
          e.preventDefault(); // prevent refresh, handle in react states + js

          // hosts cant join other sessions
          if (localStorage.getItem("hostId")) {
            setError("Hosts cannot join other sessions.");
            return;
          }

          if (!name || !inputCode) {
            setError("Please fill out both fields");
            return; // stops form from being submitted
          }

          handleJoinSession(inputCode); // use state value
        }}>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            maxLength={12}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z]*$/.test(value)) setName(value);
            }}
          />
          <input
            type="text"
            placeholder="Enter session code"
            value={inputCode}
            maxLength={5}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d{0,5}$/.test(value)) setInputCode(value);
            }}
          />
          <button type="submit">Join Session</button>
          {error && <p className="error-message" style={{ color: "red" }}>{error}</p>}
        </form>



        </div>
      </>
   );
   
}