import React, { useState, useEffect, useRef } from "react";
import { auth, database } from "../firebaseConfig/FirebaseConfig";
import { ref, push, set, onValue, remove } from "firebase/database";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Flex,
  HStack,
  VStack,
  IconButton,
  Input,
  Text,
  Select,
  FormControl,
  FormLabel,
  useToast,
  Divider,
  Heading,
  SkeletonText,
} from "@chakra-ui/react";
import { FaTimes } from "react-icons/fa";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";

const center = { lat: 28.5162618, lng: 77.1216273 };

export default function CustDash() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverName, setDriverName] = useState("");
  const [driverContact, setDriverContact] = useState("");
  const [status, setStatus] = useState("");
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });
  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const destinationRef = useRef(null);
  const sourceRef = useRef(null);
  const originRef = useRef();
  const destiantionRef = useRef();

  // Fetch driver's live location, details, and status from Firebase
  useEffect(() => {
    const rideRequestsRef = ref(database, "ride_requests");
    onValue(rideRequestsRef, (snapshot) => {
      let activeBooking = false;
      snapshot.forEach((childSnapshot) => {
        const request = childSnapshot.val();
        if (request.customerId === auth.currentUser.uid) {
          activeBooking = true;
          if (request.driverLocation) {
            setDriverLocation(request.driverLocation);
          }
          if (request.driverName) {
            setDriverName(request.driverName);
          }
          if (request.driverContact) {
            setDriverContact(request.driverContact);
          }
          if (request.status) {
            setStatus(request.status);
          }
          // if (!reqId) {
          //   setStatus("Delivered");
          // }
        }
      });
      setHasActiveBooking(activeBooking);

      // If no active booking found, reset state and allow new booking
      if (!activeBooking) {
        setDriverLocation(null);
        setDriverName("");
        setDriverContact("");
        setStatus("");
      }
    });
  }, []);

  

  const handlePlaceChangedD = () => {
    setDestination(destiantionRef.current.value);
  };

  const handlePlaceChangedS = () => {
    setSource(originRef.current.value);
  };

  const handleRequestRide = () => {
    const rideRequestsRef = ref(database, "ride_requests");
    const newRideRequestRef = push(rideRequestsRef);
    set(newRideRequestRef, {
      source: source,
      destination: destination,
      status: "pending",
      customerId: auth.currentUser.uid,
      vehicle: selectedVehicle,
      timestamp: Date.now(),
    })
      .then(() => {
        
        toast.success(`Ride requested from ${source} to ${destination}.`, { position: "top-center" });
        setHasActiveBooking(true);
      })
      .catch((error) => {
        toast.success(`Error saving ride request: ${error.message}`, { position: "top-center" });
        
      });
  };

  async function calculateRoute() {
    if (originRef.current.value === "" || destiantionRef.current.value === "") {
      toast({
        title: "Input missing.",
        description: "Please enter both origin and destination.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
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
    setDistance("");
    setDuration("");
    originRef.current.value = "";
    destiantionRef.current.value = "";
  }

  if (!isLoaded) {
    return <SkeletonText />;
  }

  return (
    <Flex
      position="relative"
      flexDirection="column"
      alignItems="center"
      h="100vh"
      w="100vw"
      bg="gray.50"
    >
      {/* Google Map Container */}
      <Box position="absolute" left={0} top={0} h="100%" w="100%">
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
          onLoad={(map) => setMap(map)}
        >
          <Marker position={center} />
          {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
          {driverLocation && (
            <Marker
              position={{ lat: driverLocation.latitude, lng: driverLocation.longitude }}
              icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
            />
          )}
        </GoogleMap>
      </Box>

      {/* Ride Request Form */}
      <Box
        p={8}
        borderRadius="lg"
        m={4}
        bgColor="white"
        shadow="lg"
        maxW="md"
        zIndex="1"
      >
        <VStack spacing={6}>
          <Heading size="lg" color="pink.600" textAlign="center">
            Request a Ride
          </Heading>
          <Divider />

          <HStack spacing={4} w="100%">
            <FormControl>
              <FormLabel>Origin</FormLabel>
              <Autocomplete
                onLoad={(autocomplete) => (sourceRef.current = autocomplete)}
                onPlaceChanged={handlePlaceChangedS}
              >
                <Input placeholder="Enter origin" ref={originRef} />
              </Autocomplete>
            </FormControl>
            <FormControl>
              <FormLabel>Destination</FormLabel>
              <Autocomplete
                onLoad={(autocomplete) => (destinationRef.current = autocomplete)}
                onPlaceChanged={handlePlaceChangedD}
              >
                <Input placeholder="Enter destination" ref={destiantionRef} />
              </Autocomplete>
            </FormControl>
          </HStack>

          <FormControl>
            <FormLabel>Select Vehicle</FormLabel>
            <Select
              placeholder="Choose vehicle"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="Car">Car</option>
              <option value="Bike">Bike</option>
              <option value="Truck">Truck</option>
            </Select>
          </FormControl>

          <Divider />

          <HStack justify="space-between" w="100%" mt={4}>
            <Button colorScheme="blue" onClick={calculateRoute} isDisabled={hasActiveBooking}>
              Calculate Route
            </Button>
            <IconButton aria-label="clear route" icon={<FaTimes />} onClick={clearRoute} isDisabled={hasActiveBooking} />
          </HStack>

          <HStack w="100%" justify="space-between">
            <Text fontSize="md">Distance: {distance}</Text>
            <Text fontSize="md">Duration: {duration}</Text>
            <Text fontSize="md">
              Cost:{" "}
              {(parseFloat(duration) * 13 + 30) *
                parseFloat(
                  selectedVehicle === "Car"
                    ? 1.0
                    : selectedVehicle === "Bike"
                    ? 0.8
                    : 1.2
                )}
            </Text>
          </HStack>

          <Button
            colorScheme="pink"
            size="lg"
            w="full"
            mt={4}
            onClick={handleRequestRide}
            isDisabled={hasActiveBooking}
          >
            {hasActiveBooking ? "Ride in Progress" : "Request Ride"}
          </Button>

          {/* Driver Details */}
          {driverName && (
            <Box w="100%" bg="gray.100" mt={6} p={4} borderRadius="lg">
              <Heading size="md" color="pink.600">
                Driver Details
              </Heading>
              <VStack align="start">
                <Text fontSize="md">Driver Name: {driverName}</Text>
                <Text fontSize="md">Driver Contact: {driverContact}</Text>
                <Text fontSize="md">Status: {status}</Text>
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}


