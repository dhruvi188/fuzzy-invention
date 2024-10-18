import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./component/login/Login";
import SignUp from "./component/signup/Signup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "./component/firebaseConfig/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import MapConfig from './component/map/Map';
import CustDash from './component/Customer-dashboard/CustDash';
import DriverDash from './component/Driver-dashboard/DriverDash';
import { signOut } from "firebase/auth";
import "./Style/App.css";

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userInfo, setUserInfo] = useState({ firstName: "", lastName: "" });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        try {
          const userDocRef = doc(db, "Users", authUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserType(userData.userType);
            setUserInfo({ firstName: userData.firstName, lastName: userData.lastName });
          } else {
            console.log("No user data found in Firestore!");
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
        }
      }
      else {
        setUserInfo({ firstName: "", lastName: "" });
        setUser(null);
        setUserType(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!", {
        position: "top-center",
      });
      setUser(null);
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  const ProtectedRoute = ({ children, redirectTo, condition }) => {

    if (loading) {
      return <div>Loading...</div>;
    }
    return condition ? children : <Navigate to={redirectTo} />;
  };




  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">

        {user &&
          <div className="top-right-menu">
            <span className="user-name">{`${userInfo.firstName} ${userInfo.lastName}`}</span>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>}
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



