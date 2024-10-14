import {
  Box,
  Flex,
  SkeletonText,
  Text,
} from '@chakra-ui/react';
import React, { useState, useEffect, useRef } from 'react';
import { auth, database, db } from '../firebaseConfig/FirebaseConfig';
import { ref, onValue, update, remove, set } from 'firebase/database';
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
  const [driverLocation, setDriverLocation] = useState(null);
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
      if (userDoc.exists()) {
        setDriverVehicleType(userDoc.data().vehicleType);
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
        if (
          request.vehicle === driverVehicleType &&
          (request.status === 'pending' || request.driverId === auth.currentUser.uid)
        ) {
          requests.push(request);
        }
      });
      setRideRequests(requests);
    });

    return () => unsubscribe();
  }, [driverVehicleType]);

  const updateDriverLocation = (requestId) => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { latitude, longitude };
          setDriverLocation(newLocation);
          const locationRef = ref(database, `ride_requests/${requestId}/driverLocation`);
          set(locationRef, newLocation);
        },
        (error) => {
          console.error('Error updating location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
            // Store the watchId to clear it later
            return watchId;
          }
        };

  // const updateDriverLocation = (requestId) => {
  //   if (navigator.geolocation) {
  //     navigator.geolocation.watchPosition(
  //       (position) => {
  //         const { latitude, longitude } = position.coords;
  //         const locationRef = ref(database, `ride_requests/${requestId}/driverLocation`);
  //         update(locationRef, {
  //           latitude,
  //           longitude,
  //         });
  //       },
  //       (error) => {
  //         console.error('Error updating location:', error);
  //       },
  //       {
  //         enableHighAccuracy: true,
  //       }
  //     );
  //   }
  // };

  const handleAcceptRide = async (requestId) => {
    try {
      const rideRequestRef = ref(database, `ride_requests/${requestId}`);
      await update(rideRequestRef, {
        status: 'accepted',
        driverId: auth.currentUser.uid,
        driverContact: auth.currentUser.phoneNumber || "Not provided",
        driverName: auth.currentUser.displayName || "Driver"
      });
      alert('Ride accepted!');
      const watchId = updateDriverLocation(requestId);
      // Store watchId in state or ref to clear it when needed
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  const handleCollected = async (requestId) => {
    try {
      const rideRequestRef = ref(database, `ride_requests/${requestId}`);
      await update(rideRequestRef, {
        status: 'collected',
      });
      alert('Goods collected!');
    } catch (error) {
      console.error('Error updating ride status to collected:', error);
    }
  };

  const handleDelivered = async (requestId) => {
    try {
      const rideRequestRef = ref(database, `ride_requests/${requestId}`);
      await update(rideRequestRef, {
        status: 'delivered',
      });
      // After marking as delivered, delete the ride request
      await remove(rideRequestRef);
      alert('Goods delivered, request deleted!');
      setRideRequests(rideRequests.filter((ride) => ride.id !== requestId));
    } catch (error) {
      console.error('Error updating ride status to delivered:', error);
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
                {request.status === 'accepted' && request.driverId === auth.currentUser.uid && (
                  <button onClick={() => handleCollected(request.id)}>
                    Goods Collected
                  </button>
                )}
                {request.status === 'collected' && request.driverId === auth.currentUser.uid && (
                  <button onClick={() => handleDelivered(request.id)}>
                    Goods Delivered
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
