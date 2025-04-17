// login is also the redirect URI because I want to seperate authenticating logic here
// (if user has a token --> then redirect to /player) keep player as just UI and player requesting logic
import "./login.css";
import { loginEndpoint} from "./auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState} from "react";

export default function Login() {
    const [inputCode, setInputCode] = useState("");
    const navigate = useNavigate();

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
        
          // set userID in local storage (one variable to associate host with rest in the DB: token & session code)
          const userId = await genUserId(token);
          const code = genRoomCode();
          localStorage.setItem("userId", userId);
          localStorage.setItem("roomCode", code); // ✅ bc state doesn't update in time to redirect to proper route IF user signed in
          
          // store token + userId + sessionCode in mongoDB
          await fetch("http://localhost:3001/api/store-session-and-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, sessionCode: code, token })
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

    // generate a userID based off the token (sha256 hashing)
    async function genUserId(token) {
        if (!token) throw new Error("Token is required to generate userId");
      
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        return hashHex;
      }


    function genRoomCode() {
        return Math.floor(10000 + Math.random() * 90000).toString();
    }

    // session Handler - when clicking button redirect to spotify auth
    const sessionHandler = () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
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
    const handleJoin = () => {
      if (inputCode) {
        navigate(`/player/${inputCode}`);
      }
    };  

   return(
      <>
        <h1 class="login-title">Join or Create a Session</h1>
        <button className="create-session-button" onClick={sessionHandler}>Create a Session 🎶</button>
        <div class>
        <input
          type="text"
          maxLength={10}
          placeholder="Name"
          // value={inputCode}
          onChange={(e) => {
            const value = e.target.value;
            if (/^\d{0,5}$/.test(value)) setInputCode(value);
          }}
        />
        <input
          type="text"
          maxLength={5}
          placeholder="Enter session code"
          value={inputCode}
          onChange={(e) => {
            const value = e.target.value;
            if (/^\d{0,5}$/.test(value)) setInputCode(value);
          }}
        />
        <button >Join Session</button> {/* onClick={handleJoinSession} */}
        {/* {error && <p style={{ color: "red" }}>{error}</p>} */}
        </div>
      </>
   );
   
}