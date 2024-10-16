import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
const script = document.getElementById('google-maps-script');
const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

if (googleMapsApiKey) {
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,marker&callback=initMap`;
  script.async = true;
  script.defer = true;
} else {
  console.error("Google Maps API key is missing!");
}

root.render(
  <React.StrictMode>
    {/* <Router> */}
    <App />
    {/* </Router> */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
