// routes for voting: writing number of votes, queueing songs, picking winner

import express from "express";
const router = express.Router();
import { storeSongQueue, updateSongQueue, getSongQueue, removeSongQueue, getUserState, setUserState } from "../routeLogic/voting.js";

// add songs to voting queue ✅
router.post("/add-song-queue", async(req, res) => {
    const { roomCode, songId, name, votes, image } = req.body;

    if (!roomCode || !songId || !name || votes === undefined) {
        console.log("Missing parameters:", {
          roomCode: !roomCode,
          songId: !songId,
          name: !name,
          votes: votes === undefined
        });
        return res.status(400).json({ error: "Room code, songId, songName and votes are required" });
    }

    try {
        const result = await storeSongQueue(roomCode, songId, name, votes, image);

        if (result.success) {
            res.status(200).json({ message: "song added to voting queue successfully" });
          } else {
            res.status(404).json({ error: result.message || "Failed to add song to voting queue" });
          }
    } catch (error) {
        console.error("Server error while adding song to voting queue:", error);
        res.status(500).json({ error: "Internal server error" });  
    }
})

// Update an existing song's votes ✅
router.post("/update-song-queue", async (req, res) => {
    const { roomCode, songId, name, votes } = req.body;

    if (!roomCode || !songId || !name || votes === undefined) {
        console.log("Missing parameters:", {
          roomCode: !roomCode,
          songId: !songId,
          name: !name,
          votes: votes === undefined
        });
        return res.status(400).json({ error: "Room code, songId, songName and votes are required" });
    }

    try {
        const result = await updateSongQueue(roomCode, songId, name, votes);

        if (result.success) {
            res.status(200).json({ message: "Song updated in voting queue successfully" });
        } else {
            res.status(404).json({ error: result.message || "Failed to update song in voting queue" });
        }
    } catch (error) {
        console.error("Server error while updating song in voting queue:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Retrieve ALL songs in the voting queue ✅
router.get("/get-song-queue", async (req, res) => {
    const { roomCode } = req.query;
  
    if (!roomCode) {
      return res.status(400).json({ error: "roomCode is required" });
    }
  
    try {
      const result = await getSongQueue(roomCode);
  
      if (result.success) {
        res.status(200).json({ songQueue: result.songQueue });
      } else {
        res.status(404).json({ error: result.message || "Failed to retrieve voting queue" });
      }
    } catch (error) {
      console.error("Server error while getting voting queue:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

// Remove a song from the voting queue ✅
router.post("/remove-song-queue", async (req, res) => {
const { roomCode, songId } = req.body;

if (!roomCode || !songId) {
    console.log("Missing parameters:", {
    roomCode: !roomCode,
    songId: !songId
    });
    return res.status(400).json({ error: "Room code and songId are required" });
}

try {
    const result = await removeSongQueue(roomCode, songId);

    if (result.success) {
    res.status(200).json({ message: "Song removed from voting queue successfully" });
    } else {
    res.status(404).json({ error: result.message || "Failed to remove song from voting queue" });
    }
} catch (error) {
    console.error("Server error while removing song from voting queue:", error);
    res.status(500).json({ error: "Internal server error" });
}
});

// check if a song is in the queue ✅
router.get("/is-song-in-queue", async (req, res) => {
  const { roomCode, songId } = req.query;

  if (!roomCode || !songId) {
    return res.status(400).json({ error: "roomCode and songId are required" });
  }

  try {
    const result = await getSongQueue(roomCode);

    if (!result.success) {
      return res.status(404).json({ error: result.message || "Queue not found" });
    }

    const foundSong = result.songQueue.find(song => song.songId === songId);

    if (foundSong) {
      res.status(200).json({ exists: true});
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Server error while checking song in queue:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// check if guest/host voted or queued ✅
router.get("/get-user-state", async (req, res) => {
  const { roomCode, userId, isHost } = req.query;

  if (!roomCode || (isHost !== "true" && !userId)) {
    return res.status(400).json({ error: "Missing roomCode or userId" });
  }

  try {
    const result = await getUserState(roomCode, userId, isHost === "true");

    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }

    res.status(200).json({ queued: result.queued, voted: result.voted });
  } catch (err) {
    console.error("Server error while getting user state:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// change status if guest/host voted or queued ✅
router.post("/set-user-state", async (req, res) => {
  const { roomCode, isHost, userId, type, value } = req.body;

  if (!roomCode || !["queued", "voted"].includes(type) || typeof value !== "boolean") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  try {
    const result = await setUserState(roomCode, userId, isHost === true || isHost === "true", type, value);

    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Server error in /set-user-state:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



  


  
  



export default router; //so backend recognizes all routes made!


