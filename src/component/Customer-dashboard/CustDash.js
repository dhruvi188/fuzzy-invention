import React, { useState, useEffect, useRef, useCallback } from "react";
import { auth, database } from "../firebaseConfig/FirebaseConfig";
import { ref, push, set, onValue, remove } from "firebase/database";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  HStack,
  VStack,
  IconButton,
  Input,
  Text,
  Select,
  FormControl,
  FormLabel,
  Divider,
  Heading,
  SkeletonText,
} from "@chakra-ui/react";
import { FaTimes, FaRoad } from "react-icons/fa";
import carIcon from "../../Images/carIcon.svg";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { vehicleTypes } from "../../constants";
import styles from '../../Style/CustDash.module.css';
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
  const mapRef = useRef();
  const [map, setMap] = useState(/** @type google.maps.Map */);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [reqSource, setReqSource] = useState("");
  const [reqDestination, setReqDestination] = useState("");
  const destinationRef = useRef(null);
  const sourceRef = useRef(null);
  const originRef = useRef();
  const destiantionRef = useRef();

  useEffect(() => {
    const rideRequestsRef = ref(database, "ride_requests");
    const unsubscribe = onValue(rideRequestsRef, (snapshot) => {
      let activeBooking = false;
      snapshot.forEach((childSnapshot) => {
        const request = childSnapshot.val();
        if (
          request.customerId === auth.currentUser.uid &&
          request.status !== "delivered"
        ) {
          activeBooking = true;
          setDriverLocation(request.driverLocation || null);
          setDriverName(request.driverName || "");
          setDriverContact(request.driverContact || "");
          setStatus(request.status || "");
          setReqSource(request.source || "");
          setReqDestination(request.destination || "");
        }
      });
      setHasActiveBooking(activeBooking);

      if (!activeBooking) {
        setDriverLocation(null);
        setDriverName("");
        setDriverContact("");
        setStatus("");
        setReqSource("");
        setReqDestination("");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    handleDriverLocation();
  }, [driverLocation]);

  const handleDestinationChange = () => {
    setDestination(destiantionRef.current.value);
  };

  const handleSourceChange = () => {
    setSource(originRef.current.value);
  };

  const handleRequestRide = () => {
    if (hasActiveBooking) {
      toast.warning("You already have an active booking.", {
        position: "top-center",
      });
      return;
    }

    const confirmRequest = window.confirm(
      "Confirm that you want to request the ride"
    );
    if (confirmRequest) {
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
          toast.success(`Ride requested from ${source} to ${destination}.`, {
            position: "top-center",
          });
          setHasActiveBooking(true);
        })
        .catch((error) => {
          toast.error(`Error saving ride request: ${error.message}`, {
            position: "top-center",
          });
        });
    }
  };

  const calculateRoute = async () => {
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

    const directionsService = new window.google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destiantionRef.current.value,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
    setDistance(results.routes[0].legs[0].distance.text);
    setDuration(results.routes[0].legs[0].duration.text);
  };
  const handleCancelRide = () => {
    if (!hasActiveBooking) {
      toast.warning("You don't have an active booking to cancel.", {
        position: "top-center",
      });
      return;
    }

    const confirmCancel = window.confirm(
      "Confirm you want to cancel the ride?"
    );
    if (confirmCancel) {
      const rideRequestsRef = ref(database, "ride_requests");

      onValue(
        rideRequestsRef,
        (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            const request = childSnapshot.val();
            if (request.customerId === auth.currentUser.uid) {
              remove(childSnapshot.ref)
                .then(() => {
                  toast.success("Ride request canceled successfully.", {
                    position: "top-center",
                  });
                  setSource("");
                  setDestination("");
                  setSelectedVehicle("");
                  setDriverLocation(null);
                  setDriverName("");
                  setDriverContact("");
                  setStatus("");
                  setHasActiveBooking(false);
                  setReqSource("");
                  setReqDestination("");
                })
                .catch((error) => {
                  toast.error(`Error canceling ride: ${error.message}`, {
                    position: "top-center",
                  });
                });
            }
          });
        },
        { onlyOnce: true }
      );
    }
  };

  const clearRoute = () => {
    setDirectionsResponse(null);
    setDistance("");
    setDuration("");
    originRef.current.value = "";
    destiantionRef.current.value = "";
  };
  const handleDriverLocation = () => {
    if (driverLocation && map) {
      map.panTo({
        lat: driverLocation.latitude,
        lng: driverLocation.longitude,
      });
      map.setZoom(15);
    }
  };

  const MyLocationButton = ({ onClick }) => {
    return (
      <button onClick={onClick}>
        <img
          src={carIcon}
          alt="My Location"
          style={{ verticalAlign: "middle", height: "36px", width: "36px" }}
        />
      </button>
    );
  };
  const onLoad = useCallback((map) => {
    mapRef.current = map;
    setMap(map);
  }, []);
  if (!isLoaded) {
    return <SkeletonText />;
  }

    return (
      <Box className={styles.container}>
        <Box className={styles.sidebar}>
          <VStack spacing={8}>
            <Heading size="lg" color="teal.600" textAlign="center">
              Request a Ride
            </Heading>
            <Divider borderColor="teal.300" />
  
            <FormControl>
              <FormLabel>Origin</FormLabel>
              <Autocomplete
                onLoad={(autocomplete) => (sourceRef.current = autocomplete)}
                onPlaceChanged={handleSourceChange}
              >
                <Input placeholder="Enter origin" ref={originRef} />
              </Autocomplete>
            </FormControl>
  
            <FormControl>
              <FormLabel>Destination</FormLabel>
              <Autocomplete
                onLoad={(autocomplete) => (destinationRef.current = autocomplete)}
                onPlaceChanged={handleDestinationChange}
              >
                <Input placeholder="Enter destination" ref={destiantionRef} />
              </Autocomplete>
            </FormControl>
  
            <FormControl>
              <FormLabel>Select Vehicle</FormLabel>
              <Select
                placeholder="Choose vehicle"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
              >
                {vehicleTypes.map((vehicleType) => (
                  <option key={vehicleType} value={vehicleType}>
                    {vehicleType}
                  </option>
                ))}
              </Select>
            </FormControl>
  
            <Divider borderColor="teal.300" />
  
            <HStack className={styles.buttonGroup}>
              <Button
                colorScheme="teal"
                onClick={calculateRoute}
                isDisabled={hasActiveBooking}
                leftIcon={<FaRoad />}
              >
                Calculate Route
              </Button>
              <IconButton
                aria-label="clear route"
                icon={<FaTimes />}
                onClick={clearRoute}
                isDisabled={hasActiveBooking}
                colorScheme="red"
              />
            </HStack>
  
            <HStack className={styles.infoGroup}>
              <Text fontSize="md">Distance: {distance}</Text>
              <Text fontSize="md">Duration: {duration}</Text>
              <Text fontSize="md">
              Cost:{" "}
              {(
                (parseFloat(duration) * 13 + 30) *
                parseFloat(
                  selectedVehicle === "Car"
                    ? 1.0
                    : selectedVehicle === "Bike"
                    ? 0.8
                    : 1.2
                )
              ).toFixed(2)}
            </Text>
            </HStack>
  
            <Button
              colorScheme="pink"
              size="lg"
              className={styles.fullWidthButton}
              onClick={handleRequestRide}
              isDisabled={hasActiveBooking}
            >
              {hasActiveBooking ? "Ride in Progress" : "Request Ride"}
            </Button>
            <Button
              colorScheme="red"
              size="lg"
              className={styles.fullWidthButton}
              onClick={handleCancelRide}
              isDisabled={status !== "pending" && status !== "accepted"}
            >
              Cancel Ride
            </Button>
  
            <Heading size="md" color="teal.600">
              Requested Ride Information
            </Heading>
            {driverName && (
              <Box className={styles.driverInfo}>
                <VStack align="center">
                  <Text fontSize="md">Driver Name: {driverName}</Text>
                  <Text fontSize="md">Driver Contact: {driverContact}</Text>
                </VStack>
              </Box>
            )}
            <Text fontSize="md">Source: {reqSource}</Text>
            <Text fontSize="md">Destination: {reqDestination}</Text>
            <Text fontSize="md">Status: {status}</Text>
          </VStack>
        </Box>
  
        <Box className={styles.mapContainer}>
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
            onLoad={onLoad}
          >
            <Marker position={center} />
            {directionsResponse && (
              <DirectionsRenderer directions={directionsResponse} />
            )}
            {driverLocation && (
              <Marker
                position={{
                  lat: driverLocation.latitude,
                  lng: driverLocation.longitude,
                }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                }}
              />
            )}
          </GoogleMap>
          <Box className={styles.myLocationButtonContainer}>
            <MyLocationButton onClick={handleDriverLocation} />
          </Box>
        </Box>
      </Box>
    );
}
