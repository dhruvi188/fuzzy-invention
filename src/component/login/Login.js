import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig/FirebaseConfig";
import { toast } from "react-toastify";
import { doc, getDoc } from "firebase/firestore"; 
import { useNavigate } from "react-router-dom";
import '../../Style/Auth.css'; 

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userType = userDoc.data().userType;
        if (userType === "Customer") {
          window.location.href = "/customer-dashboard";
        } else if (userType === "Driver") {
          window.location.href = "/driver-dashboard";
        }
        toast.success("User logged in successfully", { position: "top-center" });
      } else {
        toast.error("User type not found. Please try again.", { position: "bottom-center" });
      }
    } catch (error) {
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      navigate('/' + auth.currentUser.userType + '/dashboard');
    }
  }, [navigate]);

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2 className="auth-heading">Login</h2>

        <div className="auth-input-group">
          <label>Email address</label>
          <input
            type="email"
            className="auth-input"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="auth-input-group">
          <label>Password</label>
          <input
            type="password"
            className="auth-input"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="auth-btn-group">
          <button type="submit" className="auth-btn">Login</button>
        </div>

        <p className="auth-link">
          New user? <a href="/register">Register Here</a>
        </p>
      </form>
    </div>
  );
}
