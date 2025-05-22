"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { DanusinL7Map } from "@/components/map/DanusinL7Map";
import { LocationPrompt } from "@/components/map/location-prompt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
import { AlertCircle, Info, Play, StopCircle, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// Types for data consistency
interface LocationData {
  lon: number;
  lat: number;
}

// Represents a record from the 'danusin_users' collection
interface DanuserUserRecord {
  id: string;
  name?: string;
  isdanuser?: boolean;
  location?: LocationData; // General location for any user
  // ... other fields from danusin_users
}

// Represents a record from the 'danusin_users_location' collection (for active danuser sharing)
interface DanuserLocationRecord {
  id: string; // ID of the location record itself
  danuser_related: string; // ID of the related danusin_users record
  danuser_location: LocationData;
  expand?: { 
    danuser_related?: DanuserUserRecord;
  };
}

// Data structure for map markers
interface DanuserMarkerData extends LocationData {
  id: string; 
  name: string;
  isCurrentUser?: boolean;
}

const LOCATION_UPDATE_INTERVAL_MS = 10000; 
const SURABAYA_COORDS: [number, number] = [112.7521, -7.2575];

export default function DanusinMapPage() {
  const { user, refreshUser } = useAuth(); 
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  
  const [rawGeoLocation, setRawGeoLocation] = useState<LocationData | null>(null);
  const [displayedUserMapLocation, setDisplayedUserMapLocation] = useState<DanuserMarkerData | null>(null);
  
  const [otherDanusers, setOtherDanusers] = useState<DanuserMarkerData[]>([]);
  const [isSharingLocation, setIsSharingLocation] = useState(false); 
  
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  
  const [isLoadingOtherUsers, setIsLoadingOtherUsers] = useState(true);
  const [hasInitiallyLoadedOtherUsers, setHasInitiallyLoadedOtherUsers] = useState(false);

  const geolocationWatchIdRef = useRef<number | null>(null);
  const locationUpdateIntervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const currentUserLocationRecordIdRef = useRef<string | null>(null); 

  // Initial permission check and setup
  useEffect(() => {
    isMountedRef.current = true;
    if (!navigator.geolocation) {
      setPageError("Geolocation is not supported by your browser.");
      setLocationPermission("denied");
      return;
    }
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (!isMountedRef.current) return;
      setLocationPermission(result.state);
      if (result.state === "prompt") setShowLocationPrompt(true);
      if (result.state === "granted") {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMountedRef.current) return;
            const loc = { lon: position.coords.longitude, lat: position.coords.latitude };
            setRawGeoLocation(loc);
            if (user) {
                 setDisplayedUserMapLocation({ ...loc, id: user.id, name: user.name || "You", isCurrentUser: true });
            }
          },
          (err) => console.warn("Initial getCurrentPosition error:", err.message)
        );
      }
    });
    return () => { isMountedRef.current = false; };
  }, [user]); 

  // Fetch other Danusers' locations from 'danusin_users_location'
  useEffect(() => {
    console.log("[DanusinMapPage] Other users effect. User:", user?.id, "HasInitiallyLoaded:", hasInitiallyLoadedOtherUsers);
    if (!user) { 
        console.log("[DanusinMapPage] No user logged in, clearing otherDanusers.");
        setOtherDanusers([]);
        setIsLoadingOtherUsers(false);
        setHasInitiallyLoadedOtherUsers(true); 
        return;
    }
    
    if (!hasInitiallyLoadedOtherUsers) {
        console.log("[DanusinMapPage] Initial fetch for other users' locations: setting isLoadingOtherUsers to true.");
        setIsLoadingOtherUsers(true);
    }

    const fetchUserLocations = async () => {
      console.log(`[DanusinMapPage] Fetching other users' locations (excluding self: ${user.id}).`);
      try {
        const filter = `danuser_related.isdanuser=true && danuser_related.id != "${user.id}"`;
        console.log("[DanusinMapPage] PocketBase filter for other users' locations:", filter);
        
        const resultList = await pb.collection("danusin_users_location").getFullList<DanuserLocationRecord>({
          filter: filter,
          expand: "danuser_related", 
          sort: "-updated", 
          $autoCancel: false,
        });
        
        if (!isMountedRef.current) return;
        console.log("[DanusinMapPage] Fetched other users' locations raw from PB:", resultList);

        const mappedUsers = resultList
          .filter(record => record.expand?.danuser_related && record.danuser_location && record.expand.danuser_related.isdanuser) 
          .map(record => ({
            lon: record.danuser_location.lon,
            lat: record.danuser_location.lat,
            id: record.expand!.danuser_related!.id, 
            name: record.expand!.danuser_related!.name || "Danuser",
            isCurrentUser: false,
          }));
        
        console.log("[DanusinMapPage] Mapped other users for map:", mappedUsers);
        setOtherDanusers(mappedUsers);

      } catch (err: any) {
        if (!isMountedRef.current) return;
        console.error("[DanusinMapPage] Error fetching other danusers' locations:", err);
        setPageError(`Failed to load other users: ${err.message}`);
      } finally {
        if (isMountedRef.current) {
            console.log("[DanusinMapPage] fetchUserLocations finally block.");
            setIsLoadingOtherUsers(false);
            setHasInitiallyLoadedOtherUsers(true); 
        }
      }
    };
    fetchUserLocations();

    console.log("[DanusinMapPage] Subscribing to 'danusin_users_location' collection.");
    const unsubscribe = pb.collection("danusin_users_location").subscribe<DanuserLocationRecord>("*", async (e) => {
      if (!isMountedRef.current || !user ) return;
      
      const record = e.record;
      console.log("[DanusinMapPage] PB subscription event for 'danusin_users_location':", e.action, record);

      let relatedUser: DanuserUserRecord | undefined = record.expand?.danuser_related;
      if (!relatedUser && record.danuser_related) { 
          try {
              relatedUser = await pb.collection("danusin_users").getOne<DanuserUserRecord>(record.danuser_related, {$autoCancel: false});
          } catch (fetchErr) {
              console.warn(`[DanusinMapPage] Could not fetch related user ${record.danuser_related} for subscription event.`);
              return; 
          }
      }
      
      if (!relatedUser || relatedUser.id === user.id) return;

      setOtherDanusers(prev => {
        const index = prev.findIndex(u => u.id === relatedUser!.id); 
        let newOtherDanusers = [...prev];

        if (e.action === "create" || e.action === "update") {
          if (relatedUser!.isdanuser && record.danuser_location) {
            const updatedUserMarker: DanuserMarkerData = { 
              lon: record.danuser_location.lon, lat: record.danuser_location.lat, 
              id: relatedUser!.id, name: relatedUser!.name || "Danuser", 
              isCurrentUser: false 
            };
            if (index >= 0) newOtherDanusers[index] = updatedUserMarker;
            else newOtherDanusers.push(updatedUserMarker);
          } else { 
            if (index >= 0) newOtherDanusers = newOtherDanusers.filter(u => u.id !== relatedUser!.id);
          }
        } else if (e.action === "delete") {
          if (index >= 0) newOtherDanusers = newOtherDanusers.filter(u => u.id !== relatedUser!.id);
        }
        console.log("[DanusinMapPage] New otherDanusers state after 'danusin_users_location' subscription:", newOtherDanusers);
        return newOtherDanusers;
      });
    }, { expand: "danuser_related" }); 

    return () => { 
        console.log("[DanusinMapPage] Unsubscribing from 'danusin_users_location'.");
        pb.collection("danusin_users_location").unsubscribe(); 
    };
  }, [user, hasInitiallyLoadedOtherUsers]);

  // Geolocation Watch
  useEffect(() => {
    if (isSharingLocation && locationPermission === "granted" && navigator.geolocation) {
      geolocationWatchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          if (!isMountedRef.current) return;
          const newLoc = { lon: position.coords.longitude, lat: position.coords.latitude };
          setRawGeoLocation(newLoc);
        },
        (err) => {
          console.error("Geolocation watch error:", err.message);
          setPageError(`Location tracking error: ${err.message}`);
          setIsSharingLocation(false); 
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      if (geolocationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geolocationWatchIdRef.current);
        geolocationWatchIdRef.current = null;
      }
    }
    return () => {
      if (geolocationWatchIdRef.current !== null) navigator.geolocation.clearWatch(geolocationWatchIdRef.current);
    };
  }, [isSharingLocation, locationPermission]);

  // Function to update/create location in 'danusin_users_location' FOR DANUSERS
  const updateCurrentUserDanuserLocation = useCallback(async (lon: number, lat: number) => {
    if (!user || !user.isdanuser) { 
        console.log("[DanusinMapPage] updateCurrentUserDanuserLocation: User is not a danuser or not logged in. Skipping update to danusin_users_location.");
        return;
    }
    console.log(`[DanusinMapPage] Danuser ${user.id} attempting to update/create location in danusin_users_location`);
    try {
      if (currentUserLocationRecordIdRef.current) {
        console.log(`[DanusinMapPage] Updating existing location record ${currentUserLocationRecordIdRef.current} in danusin_users_location`);
        await pb.collection("danusin_users_location").update(currentUserLocationRecordIdRef.current, {
          danuser_location: { lon, lat }
        }, { '$autoCancel': false });
      } else {
        try {
          const existingRecords = await pb.collection("danusin_users_location").getFullList<DanuserLocationRecord>({
            filter: `danuser_related = "${user.id}"`,
            $autoCancel: false,
          });
          if (existingRecords.length > 0) {
            currentUserLocationRecordIdRef.current = existingRecords[0].id;
            console.log(`[DanusinMapPage] Found existing location record ${currentUserLocationRecordIdRef.current} for danuser, updating.`);
            await pb.collection("danusin_users_location").update(currentUserLocationRecordIdRef.current, {
              danuser_location: { lon, lat }
            }, { '$autoCancel': false });
          } else {
            console.log(`[DanusinMapPage] Creating new location record in danusin_users_location for danuser ${user.id}`);
            const newRecord = await pb.collection("danusin_users_location").create({
              danuser_related: user.id,
              danuser_location: { lon, lat }
            }, { '$autoCancel': false });
            currentUserLocationRecordIdRef.current = newRecord.id;
          }
        } catch (findCreateErr) {
            console.error("[DanusinMapPage] Error finding/creating user location record in danusin_users_location:", findCreateErr);
            toast({ title: "Location Sync Error", description: "Could not save your location (find/create).", variant: "destructive"});
            return;
        }
      }
      console.log(`[DanusinMapPage] Danuser ${user.id} location updated in danusin_users_location.`);
    } catch (err) {
      console.error("[DanusinMapPage] Error in updateCurrentUserDanuserLocation:", err);
      toast({ title: "Location Sync Error", description: "Could not save your latest location.", variant: "destructive"});
    }
  }, [user]); 

  // Setup interval for periodic updates if sharing AND user is a danuser
  useEffect(() => {
      if (isSharingLocation && user?.isdanuser) { 
          locationUpdateIntervalIdRef.current = setInterval(() => {
              if (rawGeoLocation && user) { 
                  console.log("[DanusinMapPage] Interval: Triggering updateCurrentUserDanuserLocation for danuser.");
                  updateCurrentUserDanuserLocation(rawGeoLocation.lon, rawGeoLocation.lat);
                  setDisplayedUserMapLocation({ ...rawGeoLocation, id: user.id, name: user.name || "You", isCurrentUser: true });
              }
          }, LOCATION_UPDATE_INTERVAL_MS);
      } else {
          if (locationUpdateIntervalIdRef.current) {
              clearInterval(locationUpdateIntervalIdRef.current);
              locationUpdateIntervalIdRef.current = null;
          }
      }
      return () => {
          if (locationUpdateIntervalIdRef.current) clearInterval(locationUpdateIntervalIdRef.current);
      };
  }, [isSharingLocation, rawGeoLocation, user, updateCurrentUserDanuserLocation]);


  const handleAllowLocation = () => {
    setShowLocationPrompt(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMountedRef.current) return;
          setLocationPermission("granted");
          const loc = { lon: position.coords.longitude, lat: position.coords.latitude };
          setRawGeoLocation(loc);
           if (user) { 
                 setDisplayedUserMapLocation({ ...loc, id: user.id, name: user.name || "You", isCurrentUser: true });
            }
          setPageError(null);
        },
        (err) => {
          if (!isMountedRef.current) return;
          setLocationPermission("denied");
          setPageError(getGeolocationErrorMessage(err.code));
        }
      );
    }
  };

  const handleDenyLocation = () => {
    setShowLocationPrompt(false);
    setLocationPermission("denied");
    setPageError("Location access was denied. Some map features may be unavailable.");
  };

  const handleStartSharing = async () => {
    if (!user) {
      toast({ title: "Not Logged In", description: "Please log in.", variant: "destructive" });
      return;
    }
    if (locationPermission !== "granted") {
      setShowLocationPrompt(true); 
      toast({ title: "Permission Needed", description: "Please grant location access." });
      return;
    }
    
    try {
        if (!user.isdanuser) {
            console.log(`[DanusinMapPage] Marking user ${user.id} as danuser.`);
            await pb.collection("danusin_users").update(user.id, { isdanuser: true }, { '$autoCancel': false });
            await refreshUser(); // Crucial: refresh user context to get updated isdanuser flag
            // After refresh, the 'user' object in this component will be updated.
            // We need to ensure the next steps use the *new* user object.
            // For simplicity, we'll rely on the refreshed 'user' object being available for the subsequent logic
            // or for the interval to pick up the change.
        }
        
        // This ensures that even if refreshUser is async, we proceed with sharing state.
        // The updateCurrentUserDanuserLocation function will check the latest user.isdanuser.
        setIsSharingLocation(true); 
        if (rawGeoLocation) {
            // Call updateCurrentUserDanuserLocation. It will internally check if user.isdanuser is true.
            await updateCurrentUserDanuserLocation(rawGeoLocation.lon, rawGeoLocation.lat);
            setDisplayedUserMapLocation({ ...rawGeoLocation, id: user.id, name: user.name || "You", isCurrentUser: true });
        }
        toast({ title: "Sharing Started", description: "Your location will be updated periodically." });
    } catch (error: any) {
        console.error("Error starting sharing process:", error);
        toast({ title: "Sharing Error", description: `Could not start sharing: ${error.message}`, variant: "destructive" });
    }
  };

  const handleStopSharing = async () => {
    setIsSharingLocation(false); 
    if (user) {
        try {
            await pb.collection("danusin_users").update(user.id, { isdanuser: false }, { '$autoCancel': false });
            await refreshUser(); 
            toast({ title: "Sharing Stopped", description: "You are no longer sharing your location." });
        } catch (error: any) {
            console.error("Error stopping sharing (updating isdanuser to false):", error);
            toast({ title: "Error", description: `Could not stop sharing properly: ${error.message}`, variant: "destructive" });
        }
    }
  };
  
  const getGeolocationErrorMessage = (code: number): string => {
    if (code === 1) return "Permission denied.";
    if (code === 2) return "Position unavailable.";
    if (code === 3) return "Request timed out.";
    return "Unknown geolocation error.";
  };

  const handleMapMarkerClick = useCallback((markerData: DanuserMarkerData) => {
    console.log("[DanusinMapPage] Marker clicked on page:", markerData);
    toast({
      title: `User: ${markerData.name}`,
      description: `ID: ${markerData.id}, Lat: ${markerData.lat.toFixed(4)}, Lon: ${markerData.lon.toFixed(4)}`,
    });
  }, []);

  // Initial check for existing location record for the current user
  useEffect(() => {
    if (user && !currentUserLocationRecordIdRef.current) {
      pb.collection("danusin_users_location").getFullList<DanuserLocationRecord>({
        filter: `danuser_related = "${user.id}"`,
        $autoCancel: false,
      }).then(records => {
        if (records.length > 0) {
          currentUserLocationRecordIdRef.current = records[0].id;
          console.log(`[DanusinMapPage] Found existing location record ID for current user: ${records[0].id}`);
          // If user is a danuser (from auth context, which should be fresh after login/refresh)
          // and a location record exists, resume sharing state.
          if (user.isdanuser && records[0].danuser_location) { 
             setRawGeoLocation(records[0].danuser_location);
             setDisplayedUserMapLocation({ ...records[0].danuser_location, id: user.id, name: user.name || "You", isCurrentUser: true });
             console.log(`[DanusinMapPage] Resuming sharing state for user ${user.id} based on existing location record and isdanuser=true.`);
             setIsSharingLocation(true);
          }
        }
      }).catch(err => console.warn("[DanusinMapPage] Error checking for existing location record:", err));
    }
  }, [user]); // Depends on user object to check isdanuser status


  if (!user) { 
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-12 w-12 animate-spin" />
        <p className="ml-4 text-lg">Loading user data...</p>
      </div>
    );
  }
  
  const showInitialLoadingOverlay = isLoadingOtherUsers && !hasInitiallyLoadedOtherUsers;

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <header className="text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Danusin Live Map</h1>
        <p className="text-muted-foreground">
          Connect with other Danus users in real-time (location updates every {LOCATION_UPDATE_INTERVAL_MS / 1000}s).
        </p>
      </header>

      {showLocationPrompt && (
        <LocationPrompt onAllow={handleAllowLocation} onDeny={handleDenyLocation} />
      )}

      {pageError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      )}
      
      {locationPermission === "denied" && !showLocationPrompt && (
         <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle>Location Access Denied</AlertTitle>
          <AlertDescription>
            Location access is denied. To enable map features and sharing, please allow location access in your browser settings and refresh the page.
             <Button variant="link" className="p-0 h-auto ml-1" onClick={() => setShowLocationPrompt(true)}>Re-check permission</Button>
          </AlertDescription>
        </Alert>
      )}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Location Sharing</CardTitle>
            <CardDescription>Control your live location visibility.</CardDescription>
          </CardHeader>
          <CardContent>
            {displayedUserMapLocation && (
              <div className="space-y-1">
                <p className="text-sm">Current Displayed Location:</p>
                <p className="text-xs text-muted-foreground">Lat: {displayedUserMapLocation.lat.toFixed(5)}</p>
                <p className="text-xs text-muted-foreground">Lon: {displayedUserMapLocation.lon.toFixed(5)}</p>
              </div>
            )}
            {!rawGeoLocation && locationPermission === "granted" && (
                 <p className="text-sm text-muted-foreground">Acquiring your current location...</p>
            )}
            {locationPermission !== "granted" && (
                 <p className="text-sm text-orange-600">Location permission not granted.</p>
            )}
          </CardContent>
          <CardFooter>
            {isSharingLocation ? (
              <Button variant="destructive" className="w-full" onClick={handleStopSharing}>
                <StopCircle className="mr-2 h-4 w-4" /> Stop Sharing
              </Button>
            ) : (
              <Button className="w-full" onClick={handleStartSharing} disabled={locationPermission !== "granted" || !user}>
                <Play className="mr-2 h-4 w-4" /> Start Sharing
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Live Map</CardTitle>
            <CardDescription>See yourself and other active users.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] w-full relative bg-gray-200 rounded-b-md">
              {showInitialLoadingOverlay && ( 
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-10">
                    <Users className="h-10 w-10 mb-3 text-blue-500" /> 
                    <p className="text-lg text-gray-700">Loading other users...</p>
                </div>
              )}
              <DanusinL7Map
                currentUserMapLocation={displayedUserMapLocation}
                otherUsersLocations={otherDanusers}
                isSharing={isSharingLocation}
                onMarkerClick={handleMapMarkerClick}
                initialCenter={SURABAYA_COORDS} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
