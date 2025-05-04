import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {
  return (
    <div className="home-body">
      <header className="home-hero">
        <img src="/favicon.ico" alt="Crowdplay Logo" className="home-logo" />
        <h1 className="home-title">Crowdplay 🎵</h1>
        <p className="home-subtitle">
          Create the ultimate group playlists, powered by AI and crowd energy.
        </p>
      </header>

      <div className="home-cta">
        <h2 className="home-cta-title">Start the Jam</h2>
        <div className="home-cta-buttons">
          <Link className="home-cta-button" to="/login">Join Session</Link>
          <Link className="home-cta-button secondary" to="/login">Create Session</Link>
        </div>
      </div>

      <section className="home-section">
        <h2 className="home-section-title">Why You'll Love It</h2>
        <ul className="home-features-list">
          {/* <li>🎯 Scan a QR code to join instantly</li> */}
          <li>⚡ Super easy setup — just log in with Spotify <strong>premium</strong> and go</li>
          <li>🎧 Powered by Spotify’s massive music library</li>
          <li>🗳️ Democratic voting puts the crowd in control</li>
          <li>🌐 100% browser-based — no apps or installs needed</li>
          {/* <li>🖥️ TV mode looks great on screens and projectors</li>
          <li>📱 Admin mode gives the host full playback control</li>
          <li>🎶 Fallback playlists keep the party going if the queue runs dry</li> */}
        </ul>
      </section>

      <section className="home-section">
        <h2 className="home-section-title">How to Use Crowdplay</h2>
        <div className="home-columns">
          <div className="home-column">
            <h3 className="home-column-title">1. Create a Session</h3>
            <ul className="home-column-list">
              <li>Login with Spotify</li>
              <li>Get a unique session code </li> {/*or QR code*/}
              <li>Start playing your favorite playlist</li>
            </ul>
          </div>
          <div className="home-column">
            <h3 className="home-column-title">2. Guests Join Instantly</h3>
            <ul className="home-column-list">
              <li>Friends enter the code</li> {/* or scan the QR code*/}
              <li>No app needed — web friendly</li>
              <li>Guests can queue and vote for songs</li>
            </ul>
          </div>
          <div className="home-column">
            <h3 className="home-column-title">3. Crowd Controls the Queue</h3>
            <ul className="home-column-list">
              <li>The most-voted song plays next</li>
              <li>Fallback playlist keeps music going</li>
              {/* <li>Host can skip, pause, or reset votes</li> */}
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
