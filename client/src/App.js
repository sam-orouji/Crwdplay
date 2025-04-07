// import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./views/home/home";
import Login from "./views/auth/login";
import Player from "./views/player/player";
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/player" element={<Player />} />
        <Route path="*" element="Page not found"/>
      </Routes>
    </Router>
  );
}

export default App;
