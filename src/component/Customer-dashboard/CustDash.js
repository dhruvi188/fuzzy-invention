import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, database } from "../firebaseConfig/FirebaseConfig";
import { ref, push, set, onValue } from "firebase/database";

import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Input,
  SkeletonText,
  Text,
  Select,
  FormLabel
} from '@chakra-ui/react'
import { FaTimes } from 'react-icons/fa'

import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from '@react-google-maps/api'

import { useRef, useEffect } from 'react';

const center = { lat: 28.5162618, lng: 77.1216273 }

export default function CustDash() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [driverLocation, setDriverLocation] = useState(null); // State to store driver's live location
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const destinationRef = useRef(null);
  const sourceRef = useRef(null);
  const originRef = useRef();
  const destiantionRef = useRef();

  // Fetch driver's live location from Firebase
  useEffect(() => {
    const rideRequestsRef = ref(database, 'ride_requests');
    onValue(rideRequestsRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const request = childSnapshot.val();
        // Check if this request belongs to the current customer
        if (request.customerId === auth.currentUser.uid && request.status === "accepted") {
          if (request.driverLocation) {
            setDriverLocation(request.driverLocation);
          }
        }
      });
    });
  }, []);

  const handlePlaceChangedD = () => {
    setDestination(destiantionRef.current.value);
  };

  const handlePlaceChangedS = () => {
    setSource(originRef.current.value);
  };

  const handleRequestRide = () => {
    const rideRequestsRef = ref(database, 'ride_requests');
    const newRideRequestRef = push(rideRequestsRef);
    set(newRideRequestRef, {
      source: source,
      destination: destination,
      status: "pending",
      customerId: auth.currentUser.uid,
      vehicle: selectedVehicle,
      timestamp: Date.now(),
    }).then(() => {
      alert(`Ride requested from ${source} to ${destination}`);
    }).catch((error) => {
      console.error("Error saving ride request: ", error);
    });
  };

  async function calculateRoute() {
    if (originRef.current.value === '' || destiantionRef.current.value === '') {
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destiantionRef.current.value,
      travelMode: google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
    setDistance(results.routes[0].legs[0].distance.text);
    setDuration(results.routes[0].legs[0].duration.text);
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance('');
    setDuration('');
    originRef.current.value = '';
    destiantionRef.current.value = '';
  }
  if (!isLoaded) {
    return <SkeletonText />;
  }
  return (
    <Flex position='relative' flexDirection='column' alignItems='center' h='100vh' w='100vw'>
      <Box position='absolute' left={0} top={0} h='100%' w='100%'>
        {/* Google Map Box */}
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={map => setMap(map)}
        >
          <Marker position={center} />
          {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}

          {/* Display driver's live location if available */}
          {driverLocation && (
            <Marker
              position={{ lat: driverLocation.latitude, lng: driverLocation.longitude }}
              icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }} // Blue dot for the driver
            />
          )}
        </GoogleMap>
      </Box>

      <Box p={4} borderRadius='lg' m={4} bgColor='white' shadow='base' minW='container.md' zIndex='1'>
        <HStack spacing={2} justifyContent='space-between'>
          <Box flexGrow={1}>
            <Autocomplete onLoad={(autocomplete) => (sourceRef.current = autocomplete)} onPlaceChanged={handlePlaceChangedS}>
              <Input type='text' placeholder='Origin' ref={originRef} />
            </Autocomplete>
          </Box>
          <Box flexGrow={1}>
            <Autocomplete onLoad={(autocomplete) => (destinationRef.current = autocomplete)} onPlaceChanged={handlePlaceChangedD}>
              <Input type='text' placeholder='Destination' ref={destiantionRef} />
            </Autocomplete>
          </Box>

          <HStack spacing={2} mt={4}>
            <FormLabel htmlFor="vehicle">Select Vehicle</FormLabel>
            <Select id="vehicle" placeholder="Choose vehicle" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
              <option value="Car">Car</option>
              <option value="Bike">Bike</option>
              <option value="Truck">Truck</option>
            </Select>
          </HStack>

          <ButtonGroup>
            <Button colorScheme='pink' type='submit' onClick={calculateRoute}>
              Calculate Route
            </Button>
            <IconButton aria-label='center back' icon={<FaTimes />} onClick={clearRoute} />
          </ButtonGroup>
        </HStack>

        <HStack spacing={20} mt={4}>
          <Text>Distance: {distance} </Text>
          <Text>Duration: {duration} </Text>
          <Text>Cost: {(parseFloat(duration) * 13 + 30) * parseFloat(selectedVehicle === 'Car' ? 1.0 : selectedVehicle === 'Bike' ? 0.8 : 1.2)}</Text>
          <Button onClick={handleRequestRide}>Request Ride</Button>
        </HStack>
      </Box>
    </Flex>
  );
}
