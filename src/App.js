import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./component/login/Login";
import SignUp from "./component/signup/Signup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from "./component/firebaseConfig/FirebaseConfig";
import MapConfig from './component/map/Map';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe(); 
  }, []);

  return (
    <Router>
      <div className="App">
        <div className="auth-wrapper">
          <div className="auth-inner">
            <Routes>
              {/* Landing Page, redirects based on user role */}
              <Route
                path="/"
                element={user ? <Navigate to={user?.role === 'driver' ? "/driver-dashboard" : "/customer-dashboard"} /> : <Navigate to="/login" />}
              />
              <Route path="/map" element={<MapConfig/>}/>

              {/* Login, Register */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<SignUp />} />

              {/* Dashboard for Customer and Driver */}
              {/* <Route
                path="/customer-dashboard"
                element={user ? <CustomerDashboard /> : <Navigate to="/login" />}
              /> */}

            </Routes>
            <ToastContainer />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
