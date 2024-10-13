import {
    Box,
    Flex,
    SkeletonText,
    Text,
  } from '@chakra-ui/react';
import React, { useState, useEffect, useRef } from 'react';
import { auth, database, db } from '../firebaseConfig/FirebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  DirectionsRenderer,
} from '@react-google-maps/api';

const center = { lat: 28.5162618, lng: 77.1216273 };

export default function DriverDash() {
  const [rideRequests, setRideRequests] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [driverVehicleType, setDriverVehicleType] = useState(null); 

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const mapRef = useRef();

  const fetchDriverVehicleType = async () => {
    try {
      const userDocRef = doc(db, 'Users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      console.log("hihihi", userDoc.data());
      if (userDoc.exists()) {
        setDriverVehicleType(oldval => userDoc.data().vehicleType);
        console.log("hihihi", driverVehicleType);
      }
    } catch (error) {
      console.error('Error fetching driver vehicle type:', error);
    }
  };
  useEffect(() => {

    fetchDriverVehicleType();
  }, []);

  useEffect(() => {
    const rideRequestsRef = ref(database, 'ride_requests');
    const unsubscribe = onValue(rideRequestsRef, (snapshot) => {
      const requests = [];
      snapshot.forEach((childSnapshot) => {
        const request = {
          id: childSnapshot.key,
          ...childSnapshot.val(),
        };
        
        console.log("req", request.vehicle);
        fetchDriverVehicleType();
        if (request.vehicle === driverVehicleType) {
          requests.push(request);
        }
      });
      setRideRequests(requests);
    });

    return () => unsubscribe();
  }, [driverVehicleType]);

  const handleAcceptRide = async (requestId) => {
    try {
      const rideRequestRef = ref(database, `ride_requests/${requestId}`);
      await update(rideRequestRef, {
        status: 'accepted',
        driverId: auth.currentUser.uid,
      });
      alert('Ride accepted!');
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  const calculateRoute = async (source, destination) => {
    if (!source || !destination) {
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    const results = await directionsService.route({
      origin: source,
      destination: destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });

    setDirectionsResponse(results);
    setDistance(results.routes[0].legs[0].distance.text);
    setDuration(results.routes[0].legs[0].duration.text);
  };

  const handleRideClick = (request) => {
    setSelectedRide(request);
    calculateRoute(request.source, request.destination);
  };

  if (!isLoaded) {
    return <SkeletonText />;
  }

  return (
    <Flex position="relative" flexDirection="row" h="100vh" w="100vw">
      <Box
        w="25%"
        h="100%"
        p={4}
        bgColor="white"
        shadow="base"
        overflowY="auto"
        zIndex="1"
        borderRight="1px solid #ccc"
      >
        <h2>Available Ride Requests</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {rideRequests.length === 0 ? (
            <Text>No available ride requests for your vehicle type.</Text>
          ) : (
            rideRequests.map((request) => (
              <li
                key={request.id}
                style={{
                  marginBottom: '10px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor:
                    selectedRide && selectedRide.id === request.id
                      ? '#f0f8ff'
                      : 'white',
                }}
                onClick={() => handleRideClick(request)}
              >
                <p>
                  <strong>From:</strong> {request.source} <br />
                  <strong>To:</strong> {request.destination} <br />
                  <strong>Status:</strong> {request.status} <br />
                  <strong>Vehicle Type:</strong> {request.vehicle}
                </p>
                {request.status === 'pending' && (
                  <button onClick={() => handleAcceptRide(request.id)}>
                    Accept Ride
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </Box>

      <Box position="relative" h="100%" w="75%">
        <GoogleMap
          center={center}
          zoom={10}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={(map) => (mapRef.current = map)}
        >
          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
        </GoogleMap>
      </Box>
    </Flex>
  );
}
