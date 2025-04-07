import axios from "axios"; //server client for making api calls

const authEndpoint = "https://accounts.spotify.com/authorize?";
const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const redirectUri = "http://localhost:3000/login";
const scopes = [
    "user-library-read",
    "user-read-email",
    "playlist-read-private",
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state",
];

export const loginEndpoint = `${authEndpoint}client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`;
