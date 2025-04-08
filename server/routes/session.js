// routes related to storing the hosts roomCode
// (Front end calls to database for: storing session codes, userIds, tokens)
import express from "express";
const router = express.Router();
import { storeSessionCodeAndToken, removeSessionCodeAndToken, 
         getToken } from "../database.js";
// import { client } from "../database.js";

// ++
//i technically just make one endpoint that passes in (userId, token AND sessionCode) 
// and just writes that all to one document, and then a remove that takes in userId and 
// removes all and one for get() but get i would make indiivudal ones for token but i dont care ab getting sessionCode


// endpoint to store session code + token for userId 💰
router.post("/store-session-and-token", async (req, res) => {
  const { userId, sessionCode, token } = req.body;

  console.log("🔥 /store-session-and-token route HIT");
  console.log("Request body:", req.body);
  
  if (!userId || !sessionCode || !token) {
    return res.status(400).json({ error: "userId, sessionCode and token are required" });
  }
  
  try {
    await storeSessionCodeAndToken(userId, sessionCode, token);
    res.status(200).json({ message: "Session code and token stored successfully" });
  } catch (error) {
    console.error("Error storing session code and token:", error);
    res.status(500).json({ error: "Failed to store session code and token" });
  }
});

// endpoint to remove session code & token 💰
router.post("/remove-session-and-token", async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  
  try {
    await removeSessionCodeAndToken(userId);
    res.status(200).json({ message: "Session code removed successfully" });
  } catch (error) {
    console.error("Error removing session code:", error);
    res.status(500).json({ error: "Failed to remove session code" });
  }
});

// endpoint to get-token from room code 🔴
router.post("/get-token", async (req, res) => {
  const { roomCode } = req.body; // use roomCode to get token bc unique code for each host

  if (!roomCode) return res.status(400).json({ message: "Missing room code" });

  try {
   await getToken(roomCode);
   res.status(200).json({ message: "token retrieved successfully" });
  } catch (err) {
    console.error("Error retrieving token:", err);
    return res.status(500).json({ message: "Server error" });
  }
});



export default router;