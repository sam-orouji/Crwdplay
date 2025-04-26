import "./login.css";
import { loginEndpoint } from "./auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

export default function Login() {
  const navigate = useNavigate();
  const [inputCode, setInputCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

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

      const hostId = await genUserId(token);
      const code = genRoomCode();
      localStorage.setItem("hostId", hostId);
      localStorage.setItem("roomCode", code);

      await fetch("http://localhost:3001/api/store-session-and-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId, sessionCode: code, token })
      });

      navigate(`/player/${code}`);
    };

    handleAuth();
  }, [navigate]);

  async function genUserId(token) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function genGuestId() {
    return `guest_${uuidv4()}`;
  }

  function genRoomCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  const sessionHandler = () => {
    const guestId = localStorage.getItem("guestId");
    const hostId = localStorage.getItem("hostId");
    const storedRoomCode = localStorage.getItem("roomCode");

    if (guestId) {
      setError("Guests cannot create new sessions.");
      navigate(`/player/${storedRoomCode}`);
      return;
    }

    if (hostId) {
      navigate(`/player/${storedRoomCode}`);
    } else {
      window.location.href = loginEndpoint;
    }
  };

  const handleJoinSession = async (inputCode) => {
    if (localStorage.getItem("hostId")) {
      setError("Hosts cannot join other sessions.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/validate-room-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: inputCode })
      });

      const data = await response.json();
      if (!response.ok || !data.exists) throw new Error("Room code does NOT exist");

      const guestId = genGuestId();
      localStorage.setItem("guestId", guestId);
      localStorage.setItem("roomCode", inputCode);

      const writeName = await fetch("http://localhost:3001/api/update-guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: inputCode, guestId, name })
      });

      if (!writeName.ok) throw new Error("Failed to add guest to the list");

      navigate(`/player/${inputCode}`);
    } catch (error) {
      console.error("Error validating RoomCode:", error);
      setError(error.message);
    }
  };

  return (
    <div className="login-body">
      <h1 className="login-title">Join or Create a Session</h1>

      <div className="all-buttons">
        <button className="create-session-button" onClick={sessionHandler}>
          Create a Session🎶
        </button>

        <div className="join-session-container">

          <form className="join-session-form" onSubmit={(e) => {
            e.preventDefault();
            if (localStorage.getItem("hostId")) {
              setError("Hosts cannot join other sessions.");
              return;
            }

            const guestId = localStorage.getItem("guestId");
            if (guestId) {
              setError("Logged in guests cannot join new sessions.");
              const roomCode = localStorage.getItem("roomCode");
              navigate(`/player/${roomCode}`);
              return;
            }

            if (!name || !inputCode) {
              setError("Please fill out both fields");
              return;
            }

            handleJoinSession(inputCode);
          }}>
            <input
              className="input-field"
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
              className="input-field"
              type="text"
              placeholder="Enter session code"
              value={inputCode}
              maxLength={5}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,5}$/.test(value)) setInputCode(value);
              }}
            />
            <button className="join-session-button" type="submit">
              Join Session 🚀
            </button>

            {error && <p className="error-message">{error}</p>}
          </form>
        </div>  
      </div>

    </div>
  );
}
