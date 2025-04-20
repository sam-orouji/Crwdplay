// import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./views/home/home";
import Login from "./views/auth/login";
import Player from "./views/player/player";
import AuthRequired from "./views/auth/authRequired";
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/player/:roomCode" element={<Player />} />
        <Route path="*" element="Page not found"/>
        <Route path="/unauthorized" element={<AuthRequired />} />
      </Routes>
    </Router>
  );
}

export default App;
