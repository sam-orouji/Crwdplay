// login is also the redirect URI because I want to seperate authenticating logic here
// (if user has a token --> then redirect to /player) keep player as just UI and player requesting logic
import "./login.css";
import { loginEndpoint} from "./auth";
import { useEffect, useState} from "react";

export default function Login() {
    // initialize variables
    const [token, setToken] = useState(null);
    const [userId, setUserId] = useState(null);
    const [roomCode, setRoomCode] = useState(null);

    // extract token from URL after auth -- write in DB
    // wrote extractTokenFromUrl & handleAuth functions INSIDE the hook bc the scope only pertains to logging in
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
    
          setToken(token);
    
          // set userID in local storage (one variable to associate host with rest in the DB: token & session code)
          const userId = await genUserId(token);
          const code = genRoomCode();
          localStorage.setItem("userId", userId);
          setUserId(userId);
          setRoomCode(code);
          
          // store token + userId + sessionCode in mongoDB
          await fetch("http://localhost:3001/api/store-session-and-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, sessionCode: code, token })
          });
    
          // redirect now if token & everything is ready:
          if (token) {
            window.location.href = `/player`; // ++ change later to /player/joinCode1234 `/player/${code}`
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
        // User already authenticated → go straight to the player
        console.log(userId);
        window.location.href = "/player";
      } else {
        console.log(userId);
        window.location.href = loginEndpoint;
      }
    }

   return(
      <>
        <h1 class="login-title">Join or Create a Session</h1>
        <button className="create-session-button" onClick={sessionHandler}>Create a Session 🎶</button>
      </>
   );
   
}