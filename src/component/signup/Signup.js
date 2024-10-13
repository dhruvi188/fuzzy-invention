import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "../firebaseConfig/FirebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [phone, setPhone] = useState(0);
  const [usertype, setUser] = useState("");
  const [vehicle, setVehicle] = useState("None");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      console.log(user);
      if (user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: fname,
          lastName: lname,
          phone: phone,
          userType: usertype,
          vehicleType: vehicle,
          photo:""
        });
      }
      console.log("User Registered Successfully!!");
      toast.success("User Registered Successfully!!", {
        position: "top-center",
      });
    } catch (error) {
      console.log(error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h3>Sign Up</h3>

      <div className="mb-3">
        <label>First name</label>
        <input
          type="text"
          className="form-control"
          placeholder="First name"
          onChange={(e) => setFname(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label>Last name</label>
        <input
          type="text"
          className="form-control"
          placeholder="Last name"
          onChange={(e) => setLname(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label>Email address</label>
        <input
          type="email"
          className="form-control"
          placeholder="Enter email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label>Phone no</label>
        <input
          type="phone"
          className="form-control"
          placeholder="Enter Phone No"
          onChange={(e) => setPhone(e.target.value)}
          required
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

      {usertype == "Driver" &&
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

      <div className="mb-3">
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="d-grid">
        <button type="submit" className="btn btn-primary">
          Sign Up
        </button>
      </div>
      <p className="forgot-password text-right">
        Already registered <a href="/login">Login</a>
      </p>
    </form>
  );
}
export default Register;