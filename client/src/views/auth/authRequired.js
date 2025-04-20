import { useNavigate } from "react-router-dom";

export default function AuthRequired() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>You must be logged in to access this page.</h1>
      <button 
        onClick={() => navigate("/login")} 
        style={{ padding: "10px 20px", marginTop: "1rem" }}
      >
        Go to Login
      </button>
    </div>
  );
}
