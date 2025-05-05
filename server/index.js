// express and server connection
// entry point of backend - node index.js in server directory to run
import express from "express";
import cors from "cors";
import playbackRoutes from "./routes/playbackRoutes.js";
import votingRoutes from "./routes/votingRoutes.js";
import { client } from "./routeLogic/playback.js"; // one time import

// globally connect to the database once (don't connect/reconnect in each method)
await client.connect(); 


const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = ["https://crowdplay.onrender.com"];

// Middleware (cors PICKS which routes can talk to backend )
// NO postman or cURL type site can access only on the website WITH an origin
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      // No origin header (like Postman) — reject
      return callback(new Error("CORS blocked: No origin"), false);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS blocked: Origin not allowed"), false);
    }
  },
  credentials: true,
}));
app.use(express.json());

// Routes call /api then route ex: localhost:3001/api/get-session
app.use("/api", playbackRoutes, votingRoutes); 

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