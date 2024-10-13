import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./component/login/Login";
import SignUp from "./component/signup/Signup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from "./component/firebaseConfig/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { db } from './component/firebaseConfig/FirebaseConfig'; 
import MapConfig from './component/map/Map';
import CustDash from './component/Customer-dashboard/CustDash';
import DriverDash from './component/Driver-dashboard/DriverDash';

function App() {
  const [user, setUser] = useState(null); 
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true); 

  const ProtectedRoute = ({ children, redirectTo, condition }) => {
   
    if (loading) {
      return <div>Loading...</div>; 
    }
    return condition ? children : <Navigate to={redirectTo} />;
  };

  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        
        try {
          
          const userDocRef = doc(db, "Users", authUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserType(userDoc.data().userType);
          } else {
            console.log("No user data found in Firestore!");
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
        }
      } else {
        setUser(null);
        setUserType(null); 
      }

     
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <div className="auth-wrapper">
          <div className="auth-inner">
            <Routes>
              
              <Route
                path="/"
                element={
                  user ? (
                    <Navigate to={userType === 'Driver' ? "/driver-dashboard" : "/customer-dashboard"} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              
              <Route path="/map" element={<MapConfig />} />

              
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<SignUp />} />

              
              <Route
                path="/customer-dashboard"
                element={
                  <ProtectedRoute
                    condition={user && userType === 'Customer'}
                    redirectTo="/login"
                  >
                    <CustDash />
                  </ProtectedRoute>
                }
              />

              
              <Route
                path="/driver-dashboard"
                element={
                  <ProtectedRoute
                    condition={user && userType === 'Driver'}
                    redirectTo="/login"
                  >
                    <DriverDash />
                  </ProtectedRoute>
                }
              />

              
              <Route path="*" element={<Navigate to={user ? (userType === 'Driver' ? '/driver-dashboard' : '/customer-dashboard') : '/login'} />} />

            </Routes>
            <ToastContainer />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
