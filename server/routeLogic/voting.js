// abstracting logic for routes 
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

// Load environment variables
dotenv.config({ path: "./config.env" });

const Db = process.env.ATLAS_URI; // MongoDB connection URI
export const client = new MongoClient(Db); // MongoDB client -- export to import in server.js & reuse for


// ✅ store queue in DB: roomCode, songId, name, votes (0)
export async function storeSongQueue(roomCode, songId, name, votes) {
    try {
        const db = client.db("Crowdplay");
        const usersCollection = db.collection("users");

        // if NO repeat for some reason, add that song to the queue
        // find sessions document
        const existingDoc = await usersCollection.findOne({ sessionCode: roomCode });
        if (!existingDoc) {
            console.error(`No document found with sessionCode: ${roomCode}`);
            return { success: false, message: "Room code not found" };
        }

        // Push a new song object with songId, name and votes -- creates songQueue if DNE
        const result = await usersCollection.updateOne(
            { sessionCode: roomCode.toString() },
            { $push: { songQueue: { songId, name, votes } } }, // check variables**
            { upsert: false }
        );

        return { success: true };
    } catch (e) {
        console.error("Error storing song to votingQueue:", e);
    }
}

// ✅ update queue in DB: roomCode, songId, name, votes
export async function updateSongQueue(roomCode, songId, name, votes) {
    try {
        const db = client.db("Crowdplay");
        const usersCollection = db.collection("users");

        // Find sessions document
        const existingDoc = await usersCollection.findOne({ sessionCode: roomCode });
        if (!existingDoc) {
            console.error(`No document found with sessionCode: ${roomCode}`);
            return { success: false, message: "Room code not found" };
        }

        // Update the song's name and votes inside songQueue array
        const result = await usersCollection.updateOne(
            { sessionCode: roomCode.toString(), "songQueue.songId": songId },
            { $set: { 
                "songQueue.$.name": name, 
                "songQueue.$.votes": votes 
            }},
            { upsert: false }
        );

        // Check if anything was actually modified
        if (result.modifiedCount === 0) {
            console.error(`No matching songId ${songId} found in room ${roomCode}`);
            return { success: false, message: "Song not found in voting queue" };
        }

        return { success: true };
    } catch (e) {
        console.error("Error updating song in votingQueue:", e);
    }
}

// ✅ get queue in DB: return array of {songId, name, votes}
export async function getSongQueue(roomCode) {
    try {
      const db = client.db("Crowdplay");
      const usersCollection = db.collection("users");
  
      // Find the document with the matching sessionCode
      const session = await usersCollection.findOne(
        { sessionCode: roomCode },
        { projection: { songQueue: 1, _id: 0 } }
      );
  
      if (!session || !session.songQueue) {
        console.error(`No voting queue found for sessionCode: ${roomCode}`);
        return { success: false, message: "No voting queue found for this room" };
      }
  
      return { success: true, songQueue: session.songQueue };
    } catch (e) {
      console.error("Error getting voting queue:", e);
    }
  }

// ✅ remove from queue in DB: remove song with songId inside roomCode
export async function removeSongQueue(roomCode, songId) {
    try {
      const db = client.db("Crowdplay");
      const usersCollection = db.collection("users");
  
      // Find the document first
      const existingDoc = await usersCollection.findOne({ sessionCode: roomCode });
      if (!existingDoc) {
        console.error(`No document found with sessionCode: ${roomCode}`);
        return { success: false, message: "Room code not found" };
      }
  
      // Remove the song from songQueue array
      const result = await usersCollection.updateOne(
        { sessionCode: roomCode },
        { $pull: { songQueue: { songId: songId } } }
      );
  
      // Check if anything was actually modified
      if (result.modifiedCount === 0) {
        console.error(`No matching songId ${songId} found in room ${roomCode}`);
        return { success: false, message: "Song not found in voting queue" };
      }
  
      return { success: true };
    } catch (e) {
      console.error("Error removing song from votingQueue:", e);
    }
  }
  
  


// remove from queue - roomCode, songId (couldn't enter repeats any ways)

//







