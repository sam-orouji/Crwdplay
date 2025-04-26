// abstracting logic for routes 
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

// Load environment variables
dotenv.config({ path: "./config.env" });

const Db = process.env.ATLAS_URI; // MongoDB connection URI
export const client = new MongoClient(Db); // MongoDB client -- export to import in server.js & reuse for


// store queue in DB: roomCode, songId, name, votes (0) 

// get queue

// remove from queue - roomCode, songId (couldn't enter repeats any ways)

//







