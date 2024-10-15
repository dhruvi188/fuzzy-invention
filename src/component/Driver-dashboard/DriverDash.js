import { Box, Flex, SkeletonText, Text, Button } from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";
import { auth, database, db } from "../firebaseConfig/FirebaseConfig";
import { ref, onValue, update, remove, set } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";

const center = { lat: 28.5162618, lng: 77.1216273 };

export default function DriverDash() {
  const [rideRequests, setRideRequests] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState();
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [driverVehicleType, setDriverVehicleType] = useState(null);
  const [location, setLocation] = useState(null);
  const locationIntervalRef = useRef(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const mapRef = useRef();

  const fetchDriverVehicleType = async () => {
    try {
      const userDocRef = doc(db, "Users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setDriverVehicleType(userDoc.data().vehicleType);
      }
    } catch (error) {
      console.error("Error fetching driver vehicle type:", error);
    }
  };

  function updateLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(newLocation);

          // Push driver's live location to Firebase for accepted rides
          if (selectedRide) {
            const driverLocationRef = ref(database, `ride_requests/${selectedRide.id}/driverLocation`);
            set(driverLocationRef, newLocation);
          }
        },
        (error) => {
          console.error("Error getting location:", error.message);
        }
      );
    } else {
      console.log("Geolocation not supported");
    }
  }

  useEffect(() => {
    updateLocation();
    locationIntervalRef.current = setInterval(updateLocation, 10000);

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [selectedRide]);

  useEffect(() => {
    fetchDriverVehicleType();
  }, []);

  useEffect(() => {
    const rideRequestsRef = ref(database, "ride_requests");
    const unsubscribe = onValue(rideRequestsRef, (snapshot) => {
      const requests = [];
      snapshot.forEach((childSnapshot) => {
        const request = {
          id: childSnapshot.key,
          ...childSnapshot.val(),
        };
        if (
          request.vehicle === driverVehicleType &&
          (request.status === "pending" ||
            request.driverId === auth.currentUser.uid)
        ) {
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
        status: "accepted",
        driverId: auth.currentUser.uid,
        driverContact: auth.currentUser.phoneNumber || "Not provided",
        driverName: auth.currentUser.displayName || "Driver",
      });
      setSelectedRide({ id: requestId });  // Store the accepted ride
      alert("Ride accepted!");
    } catch (error) {
      console.error("Error accepting ride:", error);
    }
  };

  const handleCollected = async (requestId) => {
    try {
      const rideRequestRef = ref(database, `ride_requests/${requestId}`);
      await update(rideRequestRef, {
        status: "collected",
      });
      alert("Goods collected!");
    } catch (error) {
      console.error("Error updating ride status to collected:", error);
    }
  };

  const handleDelivered = async (requestId) => {
    try {
      const rideRequestRef = ref(database, `ride_requests/${requestId}`);
      await update(rideRequestRef, {
        status: "delivered",
      });
      await remove(rideRequestRef);
      alert("Goods delivered, request deleted!");
      setRideRequests(rideRequests.filter((ride) => ride.id !== requestId));
    } catch (error) {
      console.error("Error updating ride status to delivered:", error);
    }
  };

  const calculateRoute = async (source, destination) => {
    if (!source || !destination) {
      return;
    }


    try {
      const directionsService = new window.google.maps.DirectionsService();
      const results = await directionsService.route({
        origin: source,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      // <DirectionsRenderer directions={null} />
      // directionsDisplay.set('directions', null);
      // Update with new route after resetting
      setDirectionsResponse(prevVal => results);
    } catch (error) {
      console.error("Error calculating route:", error);
    }
  };

  // React to the new directionsResponse and extract the distance and duration
  useEffect(() => {
    if (directionsResponse) {
      const leg = directionsResponse.routes[0].legs[0];
      setDistance(leg.distance.text);
      setDuration(leg.duration.text);
    }
  }, [directionsResponse]);

  const handleRideClick = (request) => {
    setSelectedRide(request);
    
    setDirectionsResponse(prevres => null);
    
    calculateRoute(request.source, request.destination);
  };

  if (!isLoaded) {
    return <SkeletonText />;
  }

  return (
    <Flex position="relative" flexDirection="row" h="100vh" w="100vw">
      <Box w="25%" h="100%" p={4} bgColor="white" shadow="base" overflowY="auto" zIndex="1" borderRight="1px solid #ccc">
        <h2>Available Ride Requests</h2>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {rideRequests.length === 0 ? (
            <Text>No available ride requests for your vehicle type.</Text>
          ) : (
            rideRequests.map((request) => (
              <li key={request.id} style={{ marginBottom: "10px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px", cursor: "pointer", backgroundColor: selectedRide && selectedRide.id === request.id ? "#f0f8ff" : "white" }} onClick={() => handleRideClick(request)}>
                <p>
                  <strong>From:</strong> {request.source} <br />
                  <strong>To:</strong> {request.destination} <br />
                  <strong>Status:</strong> {request.status} <br />
                  <strong>Vehicle Type:</strong> {request.vehicle}
                </p>
                {request.status === "pending" && (
                  <button onClick={() => handleAcceptRide(request.id)}>
                    Accept Ride
                  </button>
                )}
                {request.status === "accepted" && request.driverId === auth.currentUser.uid && (
                  <button onClick={() => handleCollected(request.id)}>
                    Goods Collected
                  </button>
                )}
                {request.status === "collected" && request.driverId === auth.currentUser.uid && (
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
          zoom={15}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={(map) => (mapRef.current = map)}
        >
          {/* Show current location marker */}
          {location && (
            <Marker
              position={{ lat: location.latitude, lng: location.longitude }}
              icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
            />
          )}

          {/* {!directionsResponse && (<DirectionsRenderer directions={null} />)} */}

          {directionsResponse && (<DirectionsRenderer directions={null} />) && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
        </GoogleMap>
      </Box>

    </Flex>
  );
}
