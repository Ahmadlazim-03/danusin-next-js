"use client";

import { useAuth } from "@/components/auth/auth-provider";
// Import the L7MapViewer, assuming it's in the same directory or adjust path as needed
import { L7MapViewer } from "@/components/map/l7-map-viewer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
import { AlertCircle, MapPin, Play, StopCircle } from "lucide-react";
// useRouter is not used in the provided snippet, can be removed if not needed elsewhere
// import { useRouter } from "next/navigation"; 
import { useEffect, useRef, useState } from "react";
// Added missing import for LocationPrompt
import { LocationPrompt } from "@/components/map/location-prompt";

// Define a type for the location state for clarity
interface LocationState {
  lat: number;
  lng: number; // Using lng consistent with geolocation API, will map to lon for L7Viewer
}

export default function StartDanusinPage() {
  // const router = useRouter(); // Not used
  const { user } = useAuth(); // Assuming useAuth provides updateUserLocation if needed by this page directly
  const [isSharing, setIsSharing] = useState(false);
  const [currentUserGeoLocation, setCurrentUserGeoLocation] = useState<LocationState | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // nearbyUsers state and related fetching can be removed as L7MapViewer handles danuser display
  // const [nearbyUsers, setNearbyUsers] = useState<any[]>([]); 
  const isMounted = useRef(true);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [showPrompt, setShowPrompt] = useState(false);


  // Initial check for geolocation support and permission
  useEffect(() => {
    isMounted.current = true;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLocationPermission("denied");
      setShowPrompt(false);
      return;
    }

    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (!isMounted.current) return;
        const currentPermission = result.state as "granted" | "denied" | "prompt";
        setLocationPermission(currentPermission);

        if (currentPermission === "granted") {
          // If permission already granted, try to get current location to display on map initially
          // but don't start "sharing" automatically.
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!isMounted.current) return;
              setCurrentUserGeoLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            },
            (err) => {
               if (!isMounted.current) return;
               console.warn("Could not get initial location:", getGeolocationErrorMessage(err.code));
            }
          );
        } else if (currentPermission === "prompt") {
          setShowPrompt(true); // Show prompt if permission is 'prompt'
        }
      });
    } else {
      // Fallback for browsers without Permissions API
      setShowPrompt(true);
    }
    
    return () => {
      isMounted.current = false;
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []); // Run once on mount

  // This useEffect for fetching/subscribing to nearbyUsers is removed
  // as L7MapViewer will handle displaying all danusers.

  const handleAllowLocation = () => {
    setShowPrompt(false);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (!isMounted.current) return;
                setLocationPermission("granted");
                setCurrentUserGeoLocation({ // Update location for map display
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setError(null);
                // Optionally, you could call startSharing() here if desired behavior
                // is to immediately start sharing after granting permission.
                // For now, user explicitly clicks "Start Sharing".
            },
            (err) => {
                if (!isMounted.current) return;
                setLocationPermission("denied");
                setError(getGeolocationErrorMessage(err.code));
            }
        );
    }
  };

  const handleDenyLocation = () => {
    setShowPrompt(false);
    setLocationPermission("denied");
    setError("You denied permission to use your location.");
  };


  const startSharing = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to share your location.",
        variant: "destructive",
      });
      return;
    }

    if (locationPermission !== "granted") {
      setShowPrompt(true); // Re-show prompt if permission not granted
      toast({
        title: "Location Permission Required",
        description: "Please allow location access to start sharing.",
        variant: "default",
      });
      return;
    }

    // Start watching position
    const newWatchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!isMounted.current) return;
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setCurrentUserGeoLocation(newLocation);
        setError(null); // Clear any previous errors

        // Update user location in PocketBase
        updateUserLocationInDB(latitude, longitude); // Renamed for clarity
        updateUserDanusinStatus(true); // Set user as active danuser
      },
      (err) => {
        if (!isMounted.current) return;
        console.error("Error watching location:", err);
        setError(getGeolocationErrorMessage(err.code));
        stopSharing(); // Stop sharing if watchPosition fails
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    setWatchId(newWatchId);
    setIsSharing(true);

    toast({
      title: "Location Sharing Started",
      description: "Your location is now being shared.",
    });
  };

  const stopSharing = () => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsSharing(false);
    // Don't nullify currentUserGeoLocation, so the map still shows the last known location.
    // User can choose to hide it or refresh if they want it gone.

    if (user) {
      updateUserDanusinStatus(false); // Set user as inactive danuser
    }

    toast({
      title: "Location Sharing Stopped",
      description: "Your location is no longer being shared.",
    });
  };

  // Renamed to avoid conflict if useAuth().updateUserLocation is different
  const updateUserLocationInDB = async (lat: number, lng: number) => { 
    if (!user || !isMounted.current) return;
    try {
      await pb.collection("users").update(user.id, { // Assuming 'users' collection, adjust if different
        // Ensure your PocketBase 'users' collection has a 'location' field of type 'json'
        // and expects { lat: number, lon: number }
        location: { 
          lat,
          lon: lng, // Store as 'lon' in PocketBase
        },
      });
    } catch (dbError: any) {
      if (!isMounted.current) return;
      console.error("Error updating user location in DB:", dbError);
      toast({
        title: "Database Error",
        description: `Failed to save location: ${dbError.message}`,
        variant: "destructive",
      });
    }
  };

  const updateUserDanusinStatus = async (status: boolean) => {
    if (!user || !isMounted.current) return;
    try {
      // Ensure this collection and field name are correct for your PocketBase setup
      await pb.collection("danusin_users").update(user.id, { 
        isdanuser: status,
      });
    } catch (dbError: any) {
      if (!isMounted.current) return;
      console.error("Error updating user danusin status:", dbError);
       toast({
        title: "Update Failed",
        description: `Could not update sharing status: ${dbError.message}`,
        variant: "destructive",
      });
    }
  };

  const getGeolocationErrorMessage = (code: number): string => {
    switch (code) {
      case 1: return "You denied permission to use your location.";
      case 2: return "Location information is unavailable. Check GPS or network.";
      case 3: return "The request to get your location timed out.";
      default: return "An unknown error occurred while getting your location.";
    }
  };
  
  // Prepare location for L7MapViewer (expects lon, not lng)
  const l7UserLocation = currentUserGeoLocation
    ? { lat: currentUserGeoLocation.lat, lon: currentUserGeoLocation.lng }
    : null;

  return (
    <div className="container mx-auto py-6 space-y-6 p-4 md:p-0"> {/* Added padding for smaller screens */}
      <h1 className="text-3xl font-bold tracking-tight">Start Sharing Your Location!</h1>
      <p className="text-muted-foreground">
        Let others know you're active and discoverable on the Danusin map.
      </p>

      {showPrompt && (
        <LocationPrompt
            onAllow={handleAllowLocation}
            onDeny={handleDenyLocation}
        />
      )}

      {locationPermission === "denied" && !showPrompt && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Location Access Denied</AlertTitle>
            <AlertDescription>
            {error || "You've denied location access. Sharing and map features related to your location will be limited. You can enable location access in your browser settings."}
            </AlertDescription>
        </Alert>
      )}
      {error && locationPermission !== "denied" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Share Your Location</CardTitle>
            <CardDescription>
              Start sharing to appear on the map for other Danusin users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentUserGeoLocation ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className={`mr-2 h-4 w-4 ${isSharing ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                  <span>Location: {isSharing ? "Sharing Active" : "Visible (Not Sharing)"}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Latitude: {currentUserGeoLocation.lat.toFixed(6)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Longitude: {currentUserGeoLocation.lng.toFixed(6)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {locationPermission === "granted" ? "Fetching location..." : 
                 locationPermission === "prompt" && !showPrompt ? "Awaiting location permission..." :
                 "Your location will appear here once you grant permission."}
              </p>
            )}
          </CardContent>
          <CardFooter>
            {isSharing ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={stopSharing}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Sharing
              </Button>
            ) : (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={startSharing}
                disabled={(locationPermission === "denied" && !currentUserGeoLocation) || locationPermission === "prompt"}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Sharing
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle>Live Map Preview</CardTitle>
            <CardDescription>
              See yourself and other active Danusin users on the map.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] w-full relative bg-gray-200"> {/* Adjusted height */}
              <L7MapViewer userLocation={l7UserLocation} />
               {/* Button to re-prompt for location if denied */}
               {locationPermission === "denied" && !showPrompt && (
                  <div className="absolute bottom-4 right-4 z-10">
                    <Button
                      onClick={() => {
                        setLocationPermission("prompt"); 
                        setShowPrompt(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Enable Location
                    </Button>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
