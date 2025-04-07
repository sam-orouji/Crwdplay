import { Link} from "react-router-dom";
import "./player.css";

export default function Player() {
    // function to get users profile pic
    // const setUserProfilePicture = async () => {
    
    //     if (token) {
    //       // Fetch profile picture
    //       const userProfile = await fetchUserProfile(token);
    //       if (userProfile && userProfile.profilePicture) {
            
    //         const profilePictureElement = document.getElementById('profile-picture');
    //         profilePictureElement.src = userProfile.profilePicture;
    //         profilePictureElement.style.display = 'block';
    //       }
    //     }
    //   };
    
    //   useEffect(() => {
    //     if (token) {
    //       setUserProfilePicture();
    //     }
    //   }, [token]);


    // logout event handler
    const handleLogout = async () => {
        const userId = localStorage.getItem("userId");
        if (userId) {
            localStorage.removeItem("userId");
        }
        // delete whole document associated with userID from DB ++
        await fetch("http://localhost:3001/api/remove-session-and-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });        

        window.location.href = "/";
    }

    return (
        <>
        <h1 class="player-text">Player page</h1>

        <nav class="sidebar">
            <div class="profile-pic">
                {/* <img src={setUserProfilePicture} alt="Profile" /> */}
            </div>

            <ul className="sidebar-links">
                <li><Link to="/">🏠 Home</Link></li>
                <li><Link to="/search">🔍 Search</Link></li>
                <li><Link to="/settings">⚙️ Settings</Link></li>
            </ul>
        </nav>
        <Link to="/" onClick={handleLogout}>Log Out</Link>
        </>
    );
}