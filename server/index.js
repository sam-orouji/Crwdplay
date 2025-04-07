// express and server connection
// entry point of backend - node index.js in server directory to run
import express from "express";
import cors from "cors";
import sessionRoutes from "./routes/session.js";
import { client } from "./database.js";

// globally connect to the database once (don't connect/reconnect in each method)
await client.connect(); 


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes call /api then route ex: localhost:3001/api/get-session
app.use("/api", sessionRoutes); 

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
async function gracefulShutdown() {
  console.log("Shutting down server and closing MongoDB connection...");
  await client.close();
  process.exit(0);
}

process.on("SIGINT", gracefulShutdown);  // Ctrl+C
process.on("SIGTERM", gracefulShutdown); // System shutdown / kill