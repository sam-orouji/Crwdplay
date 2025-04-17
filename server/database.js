// connection to database & seperating logic of routes
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

// Load environment variables
dotenv.config({ path: "./config.env" });


const Db = process.env.ATLAS_URI; // MongoDB connection URI
export const client = new MongoClient(Db); // MongoDB client -- export to import in server.js & reuse for


// store user's session code & token AFTER AUTH 💰
export async function storeSessionCodeAndToken(userId, sessionCode, token) {
  try {
    const db = client.db("Crowdplay");
    const usersCollection = db.collection("users");

    // Update or insert the user's session code
    await usersCollection.updateOne(
      { userId }, // Find the user by their unique ID
      { $set: { sessionCode, token } }, // Set the session code & token
      { upsert: true } // Insert the document if it doesn't exist
    );

    console.log(`Session code ${sessionCode} and ${token} stored for user ${userId}`);
  } catch (e) {
    console.error("Error storing session code and token:", e);
  }
}


// remove user's session code & token (when user signs out delete document)  ** for longterm auth change this 💰
export async function removeSessionCodeAndToken(userId) {
  try {
    const db = client.db("Crowdplay");
    const usersCollection = db.collection("users");

    // Delete entire document by matching the `userId` field
    const result = await usersCollection.deleteOne({ userId });

    if (result.deletedCount === 1) {
      console.log(`🗑️ Successfully deleted user document for userId: ${userId}`);
      return { success: true };
    } else {
      console.warn(`⚠️ No document found for userId: ${userId}`);
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
    
    console.log("Found user:", user);
    
    // Return the token if it exists, otherwise return null
    return user ? user.token : null;
  } catch (e) {
    console.error("Error retrieving token:", e);
    return null;
  }
}


// check session route for login screen/rerouting





