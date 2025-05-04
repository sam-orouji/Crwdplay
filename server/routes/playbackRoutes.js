// routes related to storing the hosts roomCode
// (Front end calls to database for: storing session codes, hostIds, tokens)
import express from "express";
const router = express.Router();
import { storeSessionCodeAndToken, updateGuests, removeGuest, removeSessionCodeAndToken, 
         getToken, validateRoomCode, getGuestNames, } from "../routeLogic/playback.js";


// endpoint to store session code + token for hostId 💰
router.post("/store-session-and-token", async (req, res) => {
  const { hostId, sessionCode, token } = req.body;
  
  if (!hostId || !sessionCode || !token) {
    return res.status(400).json({ error: "hostId, sessionCode and token are required" });
  }
  
  try {
    await storeSessionCodeAndToken(hostId, sessionCode, token);
    res.status(200).json({ message: "Session code and token stored successfully" });
  } catch (error) {
    console.error("Error storing session code and token:", error);
    res.status(500).json({ error: "Failed to store session code and token" });
  }
});

// add guests who join a session via hostId 💰
router.post("/update-guests", async (req, res) => {
  const { roomCode, guestId, name } = req.body;

  // console.log("Request body received:", req.body);

  if (!roomCode || !guestId || !name) {
    // console.log("Missing parameters:", {
    //   roomCode: !roomCode,
    //   guestId: !guestId,
    //   name: !name
    // });
    return res.status(400).json({ error: "Room code, guestId, and name are required" });
  }

  try {
    // console.log("Updating guests with data:", { roomCode, guestId, name });

    const result = await updateGuests(roomCode, guestId, name);

    if (result.success) {
      res.status(200).json({ message: "Guest added to session successfully" });
    } else {
      res.status(404).json({ error: result.message || "Failed to update guest list" });
    }
  } catch (error) {
    console.error("Server error while updating guest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// remove guest 💰
router.post("/remove-guest", async (req, res) => {
  const { roomCode, guestId } = req.body;

  // console.log("Request to remove guest:", { roomCode, guestId });

  if (!roomCode || !guestId) {
    return res.status(400).json({ error: "roomCode and guestId are required" });
  }

  try {
    const result = await removeGuest(roomCode, guestId);

    if (result.success) {
      return res.status(200).json({ message: "Guest removed successfully" });
    } else {
      return res.status(404).json({ error: result.message || "Failed to remove guest" });
    }
  } catch (error) {
    console.error("Error in /remove-guest route:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// get all names of guests in an array
router.post("/get-guest-names", async (req, res) => {
  const { roomCode } = req.body;

  if (!roomCode) {
    // return empty list if roomCode NOT provided
    return res.status(200).json({ names: [] });
  }

  try {
    const names = await getGuestNames(roomCode);
    res.status(200).json({ names });
  } catch (error) {
    console.error("Error in /get-guest-names:", error);
    res.status(500).json({ error: "Failed to retrieve guest names" });
  }
});



// endpoint to remove session code & token 💰
router.post("/remove-session-and-token", async (req, res) => {
  const { hostId } = req.body;
  
  if (!hostId) {
    return res.status(400).json({ error: "hostId is required" });
  }
  
  try {
    await removeSessionCodeAndToken(hostId);
    res.status(200).json({ message: "Session code removed successfully" });
  } catch (error) {
    console.error("Error removing session code:", error);
    res.status(500).json({ error: "Failed to remove session code" });
  }
});

// endpoint to get-token from room code 💰
router.post("/get-token", async (req, res) => {
  const { roomCode } = req.body;

  if (!roomCode) return res.status(400).json({ message: "Missing room code" });

  try {
    const token = await getToken(roomCode);
    
    if (!token) {
      return res.status(404).json({ message: "Token not found" });
    }
    
    // Return the actual token value, not just a success message
    res.status(200).json({ token });
  } catch (err) {
    console.error("Error retrieving token:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// endpoint to validate-roomCode 💰
router.post("/validate-room-code", async (req, res) => {
  const { roomCode } = req.body;

  if (!roomCode) return res.status(400).json({ message: "Missing room code" });

  try {
    // return bool of what happens
    const exists = await validateRoomCode(roomCode); // ← await is important
    res.status(200).json({ exists });
  } catch (err) {
    console.error("Error validating roomCode:", err);
    return res.status(500).json({ message: "Server error" });
  }
});




export default router;