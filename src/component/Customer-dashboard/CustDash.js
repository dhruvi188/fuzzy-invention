import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, database } from "../firebaseConfig/FirebaseConfig";
import { ref, push, set } from "firebase/database";

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
  import { FaLocationArrow, FaTimes } from 'react-icons/fa'
  
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
    // const [activeInput, setActiveInput] = useState(null);
    // const [isDashboardVisible, setIsDashboardVisible] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: ["places"],
      })
    
      const [map, setMap] = useState(/** @type google.maps.Map */ (null))
      const [directionsResponse, setDirectionsResponse] = useState(null)
      const [distance, setDistance] = useState('')
      const [duration, setDuration] = useState('')
      const destinationRef = useRef(null);
      const sourceRef = useRef(null);
    
      /**  @type React.MutableRefObject<HTMLInputElement> */
      const originRef = useRef()
      /** @type React.MutableRefObject<HTMLInputElement> */
      const destiantionRef = useRef()
    
      if (!isLoaded) {
        return <SkeletonText />
      }

    

    //   const handleInputChangeS = async (e, type) => {
    //     const value = e.target.value;
    //     setSource(value);
    //     console.log(source);
    //     // setActiveInput(type);
    //   }; 
      
    //   const handleInputChangeD = async (e, type) => {
    //     const value = e.target.value;
    //     setDestination(value);
    //     console.log(destination);
    //     // setActiveInput(type);
    //   }; 
      
      const handlePlaceChangedD = () => {
        console.log("hi", destiantionRef.current);
        if (destiantionRef.current)
        // setDestination(destiantionRef.current.value);
        setDestination(prevDest => (destiantionRef.current.value));
        console.log(destination);
        // const place = destiantionRef.current.getPlace();
        // if (place && place.geometry) {
        // const lat = place.geometry.location.lat();
        // const lng = place.geometry.location.lng();
        // console.log(lat, lng);
        // }
        // if (destinationRef.current) {
        //     console.log(destinationRef.current);
        //   const place = destinationRef.current.getPlace();
        //   if (place && place.geometry) {
        //     setDestination(place.formatted_address);
        //     console.log("Selected destination:", place.formatted_address);
        //   }
        // }
      };

      const handlePlaceChangedS = () => {
        //setSource(originRef.current.value);
        setSource(prevSource => (originRef.current.value));
        // if (sourceRef.current)
        // setSource(sourceRef.current.value);
        // if (destinationRef.current) {
        //     console.log(destinationRef.current);
        //   const place = destinationRef.current.getPlace();
        //   if (place && place.geometry) {
        //     setDestination(place.formatted_address);
        //     console.log("Selected destination:", place.formatted_address);
        //   }
        // }
      };
      

      const handleRequestRide = () => {

        // console.log(source, destination);
        const rideRequestsRef = ref(database, 'ride_requests');
        const newRideRequestRef = push(rideRequestsRef);
        set(newRideRequestRef, {
          source: source,
          destination: destination,
          status: "pending",
          customerId: auth.currentUser.uid,
          vehicle: selectedVehicle,
          timestamp: Date.now()
        }).then(() => {
          console.log("Ride request saved successfully");
          alert(`Ride requested from ${source} to ${destination}`);
        }).catch((error) => {
          console.error("Error saving ride request: ", error);
        });
      };
    
      async function calculateRoute() {
        if (originRef.current.value === '' || destiantionRef.current.value === '') {
          return
        }
        // eslint-disable-next-line no-undef
        const directionsService = new google.maps.DirectionsService();
        
        const results = await directionsService.route({
          origin: originRef.current.value,
          destination: destiantionRef.current.value,
          // eslint-disable-next-line no-undef
          travelMode: google.maps.TravelMode.DRIVING,
          transitOptions: {
            departureTime: new Date(Date.now() + 1000),
          }
          })
        setDirectionsResponse(prevres => results)
        setDistance(results.routes[0].legs[0].distance.text)
        setDuration(results.routes[0].legs[0].duration.text) 
        // console.log(typeof(distance), distance);
        // console.log("hi", results.routes[0].legs[0].start_location.value);
      }
      function getMultiplier(vehicleName) {
        if(vehicleName==="Car")
        {
          return 1.0;
        }
        else if(vehicleName==="Bike")
        {
          return 0.8;
        }
        else if(vehicleName==="Truck")
        {
          return 1.2;
        }
      }
      function clearRoute() {
        setDirectionsResponse(prevroute => null)
        setDistance('')
        setDuration('')
        originRef.current.value = ''
        destiantionRef.current.value = ''
      }
    
      return (

        <Flex
          position='relative'
          flexDirection='column'
          alignItems='center'
          h='100vh'
          w='100vw'
        >

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
              {directionsResponse && (
                <DirectionsRenderer directions={null} />
              )}
              {directionsResponse && (
                <DirectionsRenderer directions={directionsResponse} />
              )}
            </GoogleMap>
          </Box>
          <Box
            p={4}
            borderRadius='lg'
            m={4}
            bgColor='white'
            shadow='base'
            minW='container.md'
            zIndex='1'
          >
            <HStack spacing={2} justifyContent='space-between'>
              <Box flexGrow={1}>
                <Autocomplete
                onLoad={(autocomplete) => (sourceRef.current = autocomplete)}
                onPlaceChanged={handlePlaceChangedS}
                >
                  <Input type='text' placeholder='Origin' ref={originRef} 
                  //onChange={(e) => handleInputChangeS(e, 'source')}
                  />
                </Autocomplete>
              </Box>
              <Box flexGrow={1}>
                <Autocomplete
                onLoad={(autocomplete) => (destinationRef.current = autocomplete)}
                 onPlaceChanged={handlePlaceChangedD}
                >
                  <Input
                    type='text'
                    placeholder='Destination'
                    ref={destiantionRef}
                    // onChange={(e) => handleInputChangeD(e, 'destination')}
                  />
                </Autocomplete>
              </Box>

              <HStack spacing={2} mt={4}>
          <FormLabel htmlFor="vehicle">Select Vehicle</FormLabel>
          <Select
            id="vehicle"
            placeholder="Choose vehicle"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(prev => e.target.value)}
          >
            <option value="Car">Car</option>
            <option value="Bike">Bike</option>
            <option value="Truck">Truck</option>
          </Select>
        </HStack>
    
              <ButtonGroup>
                <Button colorScheme='pink' type='submit' onClick={calculateRoute}>
                  Calculate Route
                </Button>
                <IconButton
                  aria-label='center back'
                  icon={<FaTimes />}
                  onClick={clearRoute}
                />
              </ButtonGroup>
            </HStack>
            <HStack spacing={20} mt={4}>
              <Text>Distance: {distance} </Text>
              <Text>Duration: {duration} </Text>
              <Text>Cost: {(parseFloat(duration)*13 + 30)*parseFloat(getMultiplier(selectedVehicle))}</Text>
              <Button onClick={handleRequestRide}>
                  Request Ride
                </Button>
              {/* <IconButton
                aria-label='center back'
                icon={<FaLocationArrow />}
                isRound
                onClick={() => {
                  map.panTo(center)
                  map.setZoom(15)
                }}
              /> */}
            </HStack>
          </Box>
        </Flex>
      )
  }


