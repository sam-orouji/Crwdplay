// connection to database & seperating logic of routes
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

// Load environment variables
dotenv.config({ path: "./config.env" });


const Db = process.env.ATLAS_URI; // MongoDB connection URI
export const client = new MongoClient(Db); // MongoDB client -- export to import in server.js & reuse for


// store user's session code & token AFTER AUTH 💰
export async function storeSessionCodeAndToken(hostId, sessionCode, token) {
  try {
    const db = client.db("Crowdplay");
    const usersCollection = db.collection("users");

    // Update or insert the user's session code -- if no hostId it creates a document
    await usersCollection.updateOne(
      { hostId }, // Find the user by their unique ID
      { $set: { sessionCode, token } }, // Set the session code & token
      { upsert: true } // Insert the document if it doesn't exist
    );

    // console.log(`Session code ${sessionCode} and ${token} stored for user ${hostId}`);
  } catch (e) {
    console.error("Error storing session code and token:", e);
  }
}

// Update guests who join a roomCode 💰
export async function updateGuests(roomCode, guestId, name) {
  try {
    const db = client.db("Crowdplay");
    const usersCollection = db.collection("users");
    
    // console.log("Searching for document with sessionCode:", roomCode);
    
    const existingDoc = await usersCollection.findOne({ sessionCode: roomCode });
    // console.log("Found document:", existingDoc);
    
    if (!existingDoc) {
      console.error(`No document found with sessionCode: ${roomCode}`);
      return { success: false, message: "Room code not found" };
    }
    
    // Push a new guest object with ID and name into the guests array
    const result = await usersCollection.updateOne(
      { sessionCode: roomCode.toString() },
      { $push: { guests: { id: guestId, name } } },
      { upsert: false }
    );
    
    // console.log("Update result:", result);
    // console.log(`Guest ${guestId} added to room ${roomCode}: ${result.modifiedCount} document(s) updated`);
    
    return { success: true };
  } catch (e) {
    console.error("Error updating guest:", e);
    return { success: false, error: e.message };
  }
}

// remove guest 💰
export async function removeGuest(roomCode, guestId) {
  try {
    const db = client.db("Crowdplay");
    const usersCollection = db.collection("users");

    // console.log(`Attempting to remove guest ${guestId} from room ${roomCode}`);

    const result = await usersCollection.updateOne(
      { sessionCode: roomCode.toString() },
      { $pull: { guests: { id: guestId } } }
    );

    if (result.modifiedCount === 0) {
      console.warn(`No guest with ID ${guestId} found in room ${roomCode}`);
      return { success: false, message: "Guest not found in room" };
    }

    // console.log(`Guest ${guestId} removed from room ${roomCode}`);
    return { success: true };
  } catch (e) {
    console.error("Error removing guest:", e);
    return { success: false, error: e.message };
  }
}

// get array of all guests in a session
export async function getGuestNames(roomCode) {
  try {
    const db = client.db("Crowdplay");
    const usersCollection = db.collection("users");

    const session = await usersCollection.findOne({ sessionCode: roomCode });

    if (!session || !session.guests) {
      return [];
    }

    // Extract just the names
    return session.guests.map(guest => guest.name);
  } catch (e) {
    console.error("Error fetching guest names:", e);
    return [];
  }
}



// remove user's session code & token (when user signs out delete document)  ** for longterm auth change this 💰
export async function removeSessionCodeAndToken(hostId) {
  try {
    const db = client.db("Crowdplay");
    const usersCollection = db.collection("users");

    // Delete entire document by matching the `hostId` field
    const result = await usersCollection.deleteOne({ hostId });

    if (result.deletedCount === 1) {
      // console.log(`🗑️ Successfully deleted user document for hostId: ${hostId}`);
      return { success: true };
    } else {
      console.warn(`⚠️ No document found for hostId: ${hostId}`);
      return { success: false, message: "No document found" };
    }

    } catch (error) {
      console.error("❌ Error deleting user document:", error);
      return { success: false, error: error.message };
    }
}


// get token from room code 💰
export async function getToken(roomCode) {
  try {
    const db = client.db("Crowdplay");
    const users = db.collection("users");
    
    // Find the user by the unique room code
    const user = await users.findOne({ sessionCode: roomCode });
    
    // console.log("Found user:", user);
    
    // Return the token if it exists, otherwise return null
    return user ? user.token : null;
  } catch (e) {
    console.error("Error retrieving token:", e);
    return null;
  }
}


// check session route for login screen/rerouting 💰
export async function validateRoomCode(roomCode) {
  try {
    const db = client.db("Crowdplay");
    const users = db.collection("users");

    const exists = await users.findOne({ sessionCode: roomCode });
    return !!exists; // convert to true/false explicitly
  } catch (e) {
    console.error("Error validating roomCode:", e);
    return false; // prevent undefined return on error
  }
}

// 





