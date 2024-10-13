import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "../firebaseConfig/FirebaseConfig";
import { toast } from "react-toastify";
import { doc, getDoc } from "firebase/firestore"; 

function Login() {
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
        console.log("User logged in successfully, User Type: ", userType);

        
        if (userType === "Customer") {
          window.location.href = "/cust-dash";
        } else if (userType === "Driver") {
          window.location.href = "/driver-dash";
        }

        
        toast.success("User logged in successfully", {
          position: "top-center",
        });
      } else {
        console.log("No user data found in Firestore.");
        toast.error("User type not found. Please try again.", {
          position: "bottom-center",
        });
      }
    } catch (error) {
      console.log(error.message);

     
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Login</h3>

      <div className="mb-3">
        <label>Email address</label>
        <input
          type="email"
          className="form-control"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="d-grid">
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </div>
      <p className="forgot-password text-right">
        New user <a href="/register">Register Here</a>
      </p>
    </form>
  );
}

export default Login;
