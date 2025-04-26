import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {
  return (
    <div className="home-body">
      <header className="home-hero">
        <img src="/favicon.ico" alt="Spotify Jam Logo" className="home-logo" />
        <h1 className="home-title">Spotify Jam 🎵</h1>
        <p className="home-subtitle">
          Create the ultimate group playlists, powered by AI and crowd energy.
        </p>
      </header>

      <div className="home-cta">
        <h2 className="home-cta-title">Jump In!</h2>
        <div className="home-cta-buttons">
          <Link className="home-cta-button" to="/login">Join Session</Link>
          <Link className="home-cta-button secondary" to="/login">Create Session</Link>
        </div>
      </div>

      <section className="home-section">
        <h2 className="home-section-title">Why You'll Love It</h2>
        <ul className="home-features-list">
          <li>🎯 Scan a QR code to join instantly</li>
          <li>🎶 AI suggests perfect songs for your vibe</li>
          <li>🗳️ Crowd votes build the queue democratically</li>
          <li>🎤 Detects crowd energy in real-time</li>
          <li>🤖 Powered by GPT-4 and live WebSocket magic</li>
        </ul>
      </section>

      <section className="home-section">
        <h2 className="home-section-title">Under the Hood</h2>
        <div className="home-columns">
          <div className="home-column">
            <h3 className="home-column-title">Frontend</h3>
            <ul className="home-column-list">
              <li>React + Web Audio API</li>
              <li>Join via QR Code</li>
              <li>Analyze crowd noise live</li>
            </ul>
          </div>
          <div className="home-column">
            <h3 className="home-column-title">Backend</h3>
            <ul className="home-column-list">
              <li>Express.js + MongoDB Atlas</li>
              <li>Spotify OAuth authentication</li>
              <li>Manage queues, votes, playback</li>
            </ul>
          </div>
          <div className="home-column">
            <h3 className="home-column-title">Real-Time + AI</h3>
            <ul className="home-column-list">
              <li>WebSockets for live updates</li>
              <li>GPT-4 & Hugging Face recommendations</li>
              <li>Energy analysis shapes next songs</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        &copy; 2025 Crowdplay. Bringing the crowd to life.
      </footer>
    </div>
  );
}
