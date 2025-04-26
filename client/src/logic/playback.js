import axios from "axios"; // stops you from writing "await fetch(endpoint)" and HTTP errors + .json to parse JSON

export const fetchCurrentlyPlaying = async (token) => {
  if (!token) {
    console.error("No access token provided");
    return null;
  }

  try {
    const response = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data && response.data.item) {
      const track = response.data.item;
      return {
        name: track.name,
        artist: track.artists.map((artist) => artist.name).join(", "),
        album: track.album.name,
        image: track.album.images[0]?.url,
      };
    } else {
      return null; // No song playing
    }
  } catch (error) {
    console.error("Error fetching currently playing track:", error);
    return null;
  }
};


// ✅ Function to skip to the next track
export const skipToNextTrack = async (token) => {
  if (!token) {
    console.error("No access token available.");
    return;
  }

  try {
    const response = await axios.post(
      "https://api.spotify.com/v1/me/player/next",
      {}, // No body needed for this request
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Add a delay to ensure the playback state is updated correctly
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error("⚠️ Error skipping song:", error.response?.data || error.message);
  }
};


// ✅ Function to search for songs using Spotify API
export const searchSongs = async (token, query) => {
  if (!token) {
    console.error("No access token available.");
    return [];
  }

  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.tracks.items.map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      image: track.album.images[0]?.url || "",
    }));
  } catch (error) {
    console.error("⚠️ Error searching songs:", error.response?.data || error.message);
    return [];
  }
};



// ✅ Function to display duration of current song -- maybe use later
export const durationOfSong = async (token) => {
  if (!token) {
    console.error("No access token available.");
    return null;
  }

  try {
    const response = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.item) {
      const song = response.data.item;
      const durationMinutes = Math.floor(song.duration_ms / 60000);
      const durationSeconds = ((song.duration_ms % 60000) / 1000).toFixed(0).padStart(2, "0"); // Ensuring two-digit format

      return {
        message: `🎵 Song Duration: ${durationMinutes}:${durationSeconds} min`,
        duration: `${durationMinutes}:${durationSeconds}`, // Just the raw duration
        songTitle: song.name,
        // artist: song.artists.map((artist) => artist.name).join(", "), // Formatting multiple artists
      };
    } else {
      return { message: "No song currently playing." };
    }

  } catch (error) {
    console.error("Error retrieving song duration:", error.response?.data || error.message);
    return { message: "Error fetching song duration." };
  }
};


// queue songs
export const queueSong = async (token, trackUri, deviceId = null) => {
  if (!token) {
    console.error("No access token provided.");
    return;
  }

  try {
    const url = `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(trackUri)}`;
    
    // Append device ID if provided
    const finalUrl = deviceId ? `${url}&device_id=${deviceId}` : url;

    const response = await axios.post(finalUrl, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error("⚠️ Error adding song to queue:", error.response?.data || error.message);
  }
};

//fetch profile picture
export const fetchUserProfile = async (token) => {
  if (!token) {
    console.error("No access token provided");
    return null;
  }

  try {
    const response = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data) {
      return {
        displayName: response.data.display_name,
        profilePicture: response.data.images[0]?.url || "",
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error.response?.data || error.message);
    return null;
  }
};

// fetch the current playback state ** useful!
export const fetchPlaybackState = async (token) => {
  if (!token) {
    console.error("No access token provided");
    return null;
  }

  try {
    const response = await axios.get("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data) {
      const isPlaying = response.data.is_playing;
      const song = response.data.item;
      const durationMinutes = Math.floor(song.duration_ms / 60000);
      const durationSeconds = ((song.duration_ms % 60000) / 1000).toFixed(0).padStart(2, "0");
      const currentPosition = response.data.progress_ms;

      return {
        isPlaying,
        currentPosition,
        song: {
          name: song.name,
          artist: song.artists.map((artist) => artist.name).join(", "),
          album: song.album.name,
          image: song.album.images[0]?.url,
          duration: `${durationMinutes}:${durationSeconds}`,
          durationMs: song.duration_ms,
        },
      };
    } else {
      return null;
    }
  } catch (error) {
    // console.error("Error fetching playback state:", error.response?.data || error.message);
    return null;
  }
};
