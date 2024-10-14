import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig/FirebaseConfig";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [phone, setPhone] = useState("");
  const [usertype, setUser] = useState("");
  const [vehicle, setVehicle] = useState("");

  const navigate = useNavigate(); // Use navigate for redirection

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // If user is created, save additional data to Firestore
      if (user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: fname,
          lastName: lname,
          phone: phone,
          userType: usertype,
          vehicleType: vehicle,
          photo: ""
        });

        // Success message
        toast.success("User registered successfully! Redirecting to login...", {
          position: "top-center",
        });

        // Redirect to login page after sign-up
        
        navigate("/"+usertype+"-dashboard"); 
      }
    } catch (error) {
      console.log(error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };
  useEffect(() => {
    if(auth.currentUser)
    {
      navigate('/'+auth.currentUser.userType+'/-dashboard');
    }
  }, []);
  return (
    <form onSubmit={handleSubmit}>
      <h3>Sign Up</h3>

      <div className="mb-3">
        <label>First name</label>
        <input
          type="text"
          className="form-control"
          placeholder="First name"
          value={fname}
          onChange={(e) => setFname(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label>Last name</label>
        <input
          type="text"
          className="form-control"
          placeholder="Last name"
          value={lname}
          onChange={(e) => setLname(e.target.value)}
        />
      </div>

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

      <div className="mb-3">
        <label>Phone Number</label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label>Sign Up as</label>
        <select className="form-control" onChange={(e) => setUser(e.target.value)}>
        <option value="">Select an option</option>
        <option value="Driver">Driver</option>
        <option value="Customer">Customer</option>
        </select>
      </div>

      {usertype === "Driver" &&
      <div className="mb-3">
        <label>Vehicle Type</label>
        <select className="form-control" onChange={(e) => setVehicle(e.target.value)}>
        <option value="">Select an option</option>
        <option value="Car">Car</option>
        <option value="Truck">Truck</option>
        <option value="2 Wheeler">2 Wheeler</option>
        </select>
      </div>
      }

      <div className="d-grid">
        <button type="submit" className="btn btn-primary">
          Sign Up
        </button>
      </div>
      <p className="forgot-password text-right">
        Already registered <a href="/login">sign in?</a>
      </p>
    </form>
  );
}

export default Register;


