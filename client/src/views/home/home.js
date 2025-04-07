import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {

  return (
    <body class="page-body">
        <header class="hero-header">
            <h1>Spotify Jam 🎵</h1>
            <p>Real-time collaborative Spotify sessions powered by AI, audio, and the crowd</p>
        </header>

        <div class="call-to-action">
            <h1>Join the fun!</h1>
            <Link to="/login">Join a Session</Link>
            <Link to="/login">Create a Session</Link>
        </div>

        <section class="section">
            <h2 class="section-title">Features</h2>
            <ul class="features-list">
            <li>🎯 Everyone joins through QR code</li>
            <li>🎶 AI generates song recommendations based on current queue</li>
            <li>🗳️ Poll to generate initial queue before session</li>
            <li>🧑‍🤝‍🧑 Democratic queueing and playback control</li>
            <li>🎤 Volume sensing for crowd energy</li>
            </ul>
        </section>

        <section class="section">
            <h2 class="section-title">Architecture</h2>
            <div class="columns">
            <div class="column-box">
                <h3>Frontend</h3>
                <ul>
                <li>Streamlit + Web Audio API</li>
                <li>Join via QR code (React or PyQRCode)</li>
                <li>Mic input to analyze crowd noise</li>
                <li>Live queue, votes, AI suggestions</li>
                </ul>
            </div>
            <div class="column-box">
                <h3>Backend</h3>
                <ul>
                <li>Express.js server</li>
                <li>Spotify OAuth for login</li>
                <li>Handles queueing, voting, playback</li>
                </ul>
            </div>
            <div class="column-box">
                <h3>AI & Realtime</h3>
                <ul>
                <li>WebSockets for live updates</li>
                <li>GPT-4 / HuggingFace for recommendations</li>
                <li>Volume-based crowd energy analysis</li>
                <li>MongoDB Atlas for persistent data</li>
                </ul>
            </div>
            </div>
        </section>

        <footer class="page-footer">
            &copy; 2025 Spotify Jam. All rights reserved.
        </footer>
    </body>
  );
}
