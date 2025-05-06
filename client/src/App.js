import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./views/home/home";
import Login from "./views/auth/login";
import Voting from "./views/voting/voting"
import Player from "./views/player/player";
import AuthRequired from "./views/auth/authRequired";
import './App.css';
import ReactGA from "react-ga4"; // google analytics


// ----- google analytics -----
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname });
  }, [location]);
}

function App() {
  return (
    <Router>
      <Routes>
        {usePageTracking()} {/*google analytics*/}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/player/:roomCode" element={<Player />} />
        <Route path="*" element="Page not found"/>
        <Route path="/unauthorized" element={<AuthRequired />} />
        {/* <Route path="/voting" element={<Voting />} /> */}
      </Routes>
    </Router>
  );
}


export default App;
