import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig/FirebaseConfig";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../../Style/Auth.css"; // Custom CSS for styling
import { vehicleTypes } from "../../constants";
export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [phone, setPhone] = useState("");
  const [usertype, setUser] = useState("");
  const [vehicle, setVehicle] = useState("");

  const [phoneError, setPhoneError] = useState(""); // State for mobile validation error

  const navigate = useNavigate();

  const phoneRegex = /^[7-9][0-9]{9}$/; // Regex for validating Indian mobile numbers

  const validatePhone = (value) => {
    if (!value) {
      setPhoneError("Phone number is required.");
    } else if (!phoneRegex.test(value)) {
      setPhoneError(
        "Invalid phone number. Must be 10 digits and start with 7, 8, or 9."
      );
    } else {
      setPhoneError(""); // Clear error if valid
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if phone number is valid
    validatePhone(phone);

    // If there's any error, don't submit the form
    if (phoneError) {
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: fname,
          lastName: lname,
          phone: phone,
          userType: usertype,
          vehicleType: vehicle,
          photo: "",
        });

        toast.success("User registered successfully! Redirecting...", {
          position: "top-center",
        });
        navigate("/" + usertype + "-dashboard");
      }
    } catch (error) {
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      navigate("/" + auth.currentUser.userType + "/dashboard");
    }
  }, [navigate]);

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2 className="auth-heading">Sign Up</h2>

        <div className="auth-input-group">
          <label>First Name</label>
          <input
            type="text"
            className="auth-input"
            placeholder="First name"
            value={fname}
            required={true}
            onChange={(e) => setFname(e.target.value)}
          />
        </div>

        <div className="auth-input-group">
          <label>Last Name</label>
          <input
            type="text"
            className="auth-input"
            placeholder="Last name"
            value={lname}
            onChange={(e) => setLname(e.target.value)}
          />
        </div>

        <div className="auth-input-group">
          <label>Email address</label>
          <input
            type="email"
            className="auth-input"
            placeholder="Enter email"
            value={email}
            required={true}
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
            required={true}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="auth-input-group">
          <label>Phone Number</label>
          <input
            type="text"
            className="auth-input"
            placeholder="Enter phone number"
            value={phone}
            required={true}
            onChange={(e) => {
              setPhone(e.target.value);
              validatePhone(e.target.value); // Real-time validation on user input
            }}
          />
          {phoneError && <p className="auth-error">{phoneError}</p>}
        </div>

        <div className="auth-input-group">
          <label>Sign Up as</label>
          <select
            className="auth-input"
            value={usertype}
            onChange={(e) => setUser(e.target.value)}
            required={true}
          >
            <option value="">Select an option</option>
            <option value="Driver">Driver</option>
            <option value="Customer">Customer</option>
          </select>
        </div>

        {usertype === "Driver" && (
          <div className="auth-input-group">
            <label>Vehicle Type</label>
            <select
              className="auth-input"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              required={true}
            >
              <option value="">Select an option</option>
              {vehicleTypes.map((vehicleType) => (
                <option key={vehicleType} value={vehicleType}>
                  {vehicleType}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="auth-btn-group">
          <button type="submit" className="auth-btn">
            Sign Up
          </button>
        </div>

        <p className="auth-link">
          Already registered? <a href="/login">Sign in</a>
        </p>
      </form>
    </div>
  );
}
