"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { DanusinL7Map } from "@/components/map/DanusinL7Map";
import { LocationPrompt } from "@/components/map/location-prompt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
import { AlertCircle, Info, Loader2, MapPinOff, Play, StopCircle, Users, WifiOff, XCircle } from "lucide-react"; // Added XCircle
import { useCallback, useEffect, useRef, useState } from "react";

interface LocationData {
  lon: number;
  lat: number;
}

interface DanuserUserRecord { // For data expanded from danuser_related
  id: string;
  username?: string;
  name?: string;
  // Potentially add avatar or other details if available and needed for the card
  avatar?: string; 
}

interface DanuserLocationRecord { // Represents a record from danusin_users_location
  id: string;
  updated: string;
  danuser_related: string; 
  danuser_location: LocationData;
  isactive?: boolean; // Your new field from PocketBase for active status
  expand?: {
    danuser_related?: DanuserUserRecord;
  };
}

interface DanuserMapMarker extends LocationData { // Data structure for map markers
    id: string;
    name: string;
    isCurrentUser?: boolean;
    isActive?: boolean; // To be used by DanusinL7Map for styling
    // Add any other fields you might want to display on the card, e.g., from DanuserUserRecord
    avatarUrl?: string; 
    username?: string;
}

const SURABAYA_COORDS: [number, number] = [112.750833, -7.249167];
const LOCATION_UPDATE_INTERVAL = 15000; // 15 seconds
const USER_LOCATION_ACTIVE_THRESHOLD_MINUTES = 15; 

export default function RealtimeMapPage() {
  const { user, loading: authLoading, upsertLiveLocation, deleteLiveLocation } = useAuth();

  const [rawUserLocation, setRawUserLocation] = useState<LocationData | null>(null);
  const [displayedUserMapLocation, setDisplayedUserMapLocation] = useState<DanuserMapMarker | null>(null);
  const [otherDanusers, setOtherDanusers] = useState<DanuserMapMarker[]>([]);
  const [locationPermission, setLocationPermission] = useState<PermissionState | "prompt" | "loading">("loading");
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [currentLocationRecordId, setCurrentLocationRecordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInitialLoadingOverlay, setInitialLoadingOverlay] = useState(true);
  const [isFetchingOwnRecordId, setIsFetchingOwnRecordId] = useState(true);
  const [selectedMarkerData, setSelectedMarkerData] = useState<DanuserMapMarker | null>(null); // State for clicked marker card

  const watchIdRef = useRef<number | null>(null);
  const locationUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialFetchInProgressRef = useRef(false); 

  // Effect to fetch existing live location record ID for the current user
  useEffect(() => {
    if (authLoading || !user?.id) {
      setIsFetchingOwnRecordId(false);
      setCurrentLocationRecordId(null);
      return;
    }

    let didCancel = false;
    const fetchOwnRecordId = async () => {
      console.log("[Map Page] Attempting to fetch own existing location record ID...");
      setIsFetchingOwnRecordId(true);
      try {
        const existingRecord = await pb.collection('danusin_users_location')
          .getFirstListItem<DanuserLocationRecord>(`danuser_related = "${user.id}"`, {
            sort: '-updated', 
            $autoCancel: false, 
          });
        
        if (didCancel) return;
        if (existingRecord && existingRecord.id) {
          console.log("[Map Page] Found existing location record for user:", existingRecord.id);
          setCurrentLocationRecordId(existingRecord.id);
        } else {
          console.log("[Map Page] No existing location record found for user.");
          setCurrentLocationRecordId(null);
        }
      } catch (listError: any) {
        if (didCancel) return;
        if (listError.status === 404) { 
          console.log("[Map Page] No existing location record found for user (404).");
          setCurrentLocationRecordId(null);
        } else {
          console.error("[Map Page] Error fetching existing location record ID:", listError);
          setCurrentLocationRecordId(null); 
        }
      } finally {
        if (!didCancel) setIsFetchingOwnRecordId(false);
      }
    };

    fetchOwnRecordId();
    return () => { didCancel = true; }

  }, [user?.id, authLoading]);


  const stableStopSharing = useCallback(() => {
    setIsSharingLocation(false);
    setRawUserLocation(null); 

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (locationUpdateTimeoutRef.current) {
        clearTimeout(locationUpdateTimeoutRef.current);
        locationUpdateTimeoutRef.current = null;
    }

    if (currentLocationRecordId && user?.id && deleteLiveLocation) {
      console.log(`[Map Page] Attempting to delete location record ${currentLocationRecordId} via AuthProvider.`);
      deleteLiveLocation(currentLocationRecordId)
        .then(() => {
          setCurrentLocationRecordId(null); 
          toast({ title: "Location Sharing Stopped", description: "Your location record has been removed." });
        })
        .catch((err) => {
          console.error("Failed to delete location record via AuthProvider:", err);
          toast({ title: "Sharing Stopped", description: "Could not remove previous location record from server. Sharing is off.", variant: "destructive" });
        });
    } else {
        if (!deleteLiveLocation && user?.id && currentLocationRecordId) console.warn("deleteLiveLocation function not available from AuthContext.");
         toast({ title: "Location Sharing Stopped" });
    }
  }, [currentLocationRecordId, user?.id, deleteLiveLocation, toast]);


  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((permissionStatus) => {
        setLocationPermission(permissionStatus.state);
        const permissionChangeHandler = () => {
          setLocationPermission(permissionStatus.state);
          if (permissionStatus.state !== "granted" && isSharingLocation) {
            stableStopSharing(); 
            setError("Location permission was revoked. Please grant permission to share your location.");
          }
        };
        permissionStatus.onchange = permissionChangeHandler;
        return () => {
          permissionStatus.onchange = null;
        };
      });
    } else {
      setLocationPermission("prompt"); 
    }
  }, [isSharingLocation, stableStopSharing]); 


  const sendLocationToPocketBase = useCallback(async (locationDataValue: LocationData) => {
    if (!user || !user.id || !upsertLiveLocation) {
      setError("Cannot update location: User or update function is not available.");
      console.warn("[Map Page] sendLocationToPocketBase: User or upsertLiveLocation not available.");
      return;
    }
    if (isFetchingOwnRecordId) {
      console.log("[Map Page] Still fetching own record ID, deferring location send.");
      return; 
    }

    try {
      console.log(`[Map Page] Sending location. CurrentRecordId: ${currentLocationRecordId || "N/A (will create new)"}`);
      const newRecordId = await upsertLiveLocation(locationDataValue, currentLocationRecordId);
      
      if (newRecordId) {
        if (newRecordId !== currentLocationRecordId) {
          setCurrentLocationRecordId(newRecordId); 
          console.log("[Map Page] Location record upserted/created. New ID:", newRecordId);
        }
        setError(null); 
      } else {
         console.error("[Map Page] Failed to update live location. No record ID returned from server.");
         setError("Failed to update live location. No record ID returned from server.");
      }
    } catch (err: any) {
      console.error("[Map Page] Error from upsertLiveLocation:", err.message, err);
      setError(`Server error: ${err.message || 'Location update failed.'} Check PocketBase rules for 'danusin_users_location'.`);
      if (String(err.message).includes("401") || String(err.message).includes("403") || err.status === 401 || err.status === 403) {
        console.warn("[Map Page] Authorization error during location update. Stopping sharing.");
        stableStopSharing(); 
      }
    }
  }, [user, currentLocationRecordId, upsertLiveLocation, isFetchingOwnRecordId, stableStopSharing]);


  useEffect(() => {
    if (isSharingLocation && locationPermission === "granted") {
      const onSuccess: PositionCallback = (position) => {
        const newLocation: LocationData = {
          lon: position.coords.longitude,
          lat: position.coords.latitude,
        };
        setRawUserLocation(newLocation); 
        setError(null); 
      };
      const onError: PositionErrorCallback = (err) => {
        console.error("Error getting location via watchPosition:", err);
        setError(`Geolocation error: ${err.message}.`);
        setRawUserLocation(null); 
        if (err.code === err.PERMISSION_DENIED) { 
            setLocationPermission("denied");
            stableStopSharing(); 
        }
      };

      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 
      });

      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true, timeout: 10000, maximumAge: 0, 
      });
      
      return () => { 
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
      };
    } else { 
      if (watchIdRef.current !== null) { 
         navigator.geolocation.clearWatch(watchIdRef.current);
         watchIdRef.current = null;
      }
      setRawUserLocation(null); 
    }
  }, [isSharingLocation, locationPermission, stableStopSharing]); 

 useEffect(() => {
    if (isSharingLocation && rawUserLocation && user?.id) {
      setDisplayedUserMapLocation({
        ...rawUserLocation,
        id: user.id,
        name: user.name || user.username || "You",
        isCurrentUser: true,
        isActive: true, 
        username: user.username,
        // avatarUrl: user.avatar ? pb.getFileUrl(user, user.avatar) : undefined // Example if avatar is in user model
      });

      if (locationUpdateTimeoutRef.current === null && !isFetchingOwnRecordId) {
        sendLocationToPocketBase(rawUserLocation);
      }

      if (locationUpdateTimeoutRef.current) {
        clearTimeout(locationUpdateTimeoutRef.current);
      }

      locationUpdateTimeoutRef.current = setTimeout(() => {
        if(rawUserLocation && isSharingLocation && !isFetchingOwnRecordId) { 
            sendLocationToPocketBase(rawUserLocation);
        }
        locationUpdateTimeoutRef.current = null; 
      }, LOCATION_UPDATE_INTERVAL);

    } else if (!isSharingLocation) {
      setDisplayedUserMapLocation(null);
      if (locationUpdateTimeoutRef.current) {
        clearTimeout(locationUpdateTimeoutRef.current);
        locationUpdateTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (locationUpdateTimeoutRef.current) {
        clearTimeout(locationUpdateTimeoutRef.current);
      }
    };
  }, [isSharingLocation, rawUserLocation, user, sendLocationToPocketBase, isFetchingOwnRecordId]);


  useEffect(() => {
    if (authLoading || !user?.id) {
      setInitialLoadingOverlay(false); 
      setOtherDanusers([]); 
      initialFetchInProgressRef.current = false; 
      return;
    }
    
    if (initialFetchInProgressRef.current) {
      console.log("[Map Page] Initial fetch for other users is already in progress. Skipping.");
      return; 
    }
  
    const currentUserId = user.id;
    let unsubscribeRealtime: (() => void) | null = null;
    let didCancelEffect = false;
  
    const processRecordToMarker = (record: DanuserLocationRecord): DanuserMapMarker | null => {
        const relatedUser = record.expand?.danuser_related;
        const locationData = record.danuser_location;
        
        if (!locationData || typeof locationData.lat !== 'number' || typeof locationData.lon !== 'number' || 
            !relatedUser || !relatedUser.id || relatedUser.id === currentUserId) {
            return null;
        }
        // Construct avatar URL if avatar field exists in relatedUser (PocketBase specific)
        // const avatarFilename = relatedUser.avatar; // Assuming 'avatar' is the field name for the file
        // const avatarUrl = avatarFilename ? pb.files.getUrl(relatedUser, avatarFilename, { 'thumb': '100x100' }) : undefined;

        return {
            id: relatedUser.id,
            name: relatedUser.name || `Danuser ${relatedUser.id.substring(0,5)}`, // Use name, fallback to username, then ID
            username: relatedUser.username,
            lat: locationData.lat,
            lon: locationData.lon,
            isCurrentUser: false,
            isActive: record.isactive === true, 
            // avatarUrl: avatarUrl, // Add avatar URL to marker data
        };
    };
  
    const fetchInitialAndSubscribe = async () => {
      if (initialFetchInProgressRef.current || didCancelEffect) return;
      
      initialFetchInProgressRef.current = true;
      setInitialLoadingOverlay(true); 
      console.log("[Map Page] Starting initial fetch and subscribe for other users' locations...");
  
      try {
        const thresholdDate = new Date(Date.now() - USER_LOCATION_ACTIVE_THRESHOLD_MINUTES * 60 * 1000);
        const filterDateString = thresholdDate.toISOString().replace("T", " ").substring(0, 19); 

        const initialRecords = await pb.collection('danusin_users_location').getFullList<DanuserLocationRecord>({
          filter: `(updated >= "${filterDateString}" || isactive = true) && danuser_related != "${currentUserId}"`,
          expand: 'danuser_related', 
          sort: '-updated', 
          $autoCancel: false, 
        });

        if (didCancelEffect) { initialFetchInProgressRef.current = false; return; }

        console.log("[Map Page] Initial other user records fetched:", initialRecords.length);
        const initialMappedUsers = initialRecords.map(processRecordToMarker).filter(Boolean) as DanuserMapMarker[];
        
        const uniqueUsersMap = new Map<string, DanuserMapMarker>();
        initialMappedUsers.forEach(userMarker => {
            if (!uniqueUsersMap.has(userMarker.id)) { 
                uniqueUsersMap.set(userMarker.id, userMarker);
            }
        });
        
        if (!didCancelEffect) setOtherDanusers(Array.from(uniqueUsersMap.values()));

      } catch (error: any) {
        if (didCancelEffect) { initialFetchInProgressRef.current = false; return; }
        console.error("[Map Page] Failed to fetch initial other danusers:", error.message, error); 
        if (error.data && Object.keys(error.data).length > 0) { 
            console.error("[Map Page] PocketBase error data (initial fetch):", error.data);
        }
        const isAutocancelError = error.name === 'ClientResponseError' && error.status === 0;
        if (!isAutocancelError) {
            toast({title: "Error Loading Users", description: `Could not load other users initially. ${error.message || ''}`,variant: "destructive"});
        }
      } finally {
        if (!didCancelEffect) setInitialLoadingOverlay(false);
        setTimeout(() => { initialFetchInProgressRef.current = false; }, 100);
      }
      
      if (didCancelEffect) return;

      try {
        console.log("[Map Page] Subscribing to 'danusin_users_location' changes...");
        unsubscribeRealtime = await pb.collection('danusin_users_location').subscribe('*', async (e) => {
          if (didCancelEffect) { if(unsubscribeRealtime) unsubscribeRealtime(); return; }
          
          console.log("[Map Page] Realtime event:", e.action, "on record ID:", e.record.id, "for user_related:", (e.record as DanuserLocationRecord).danuser_related, "isactive:", (e.record as DanuserLocationRecord).isactive);
          
          const marker = processRecordToMarker(e.record as DanuserLocationRecord);
          
          if ((e.record as DanuserLocationRecord).danuser_related === currentUserId) {
            if (e.action === 'create' || e.action === 'update') {
                 setCurrentLocationRecordId(e.record.id);
            } else if (e.action === 'delete' && e.record.id === currentLocationRecordId) {
                 setCurrentLocationRecordId(null);
            }
            return;
          }
  
          if (!didCancelEffect) {
            setOtherDanusers(prevUsers => {
                let newUsers = [...prevUsers];
                const existingUserIndex = marker ? newUsers.findIndex(u => u.id === marker.id) : -1;

                if (e.action === 'create' || e.action === 'update') {
                    if (marker && marker.isActive) { 
                        if (existingUserIndex !== -1) {
                            newUsers[existingUserIndex] = marker; 
                        } else {
                            newUsers.push(marker); 
                        }
                    } else if (existingUserIndex !== -1) { 
                        newUsers.splice(existingUserIndex, 1);
                    }
                } else if (e.action === 'delete') {
                    const userRelatedIdToDelete = (e.record as DanuserLocationRecord).danuser_related;
                    const idxToDelete = newUsers.findIndex(u => u.id === userRelatedIdToDelete);
                    if (idxToDelete !== -1) {
                        newUsers.splice(idxToDelete, 1);
                    }
                }
                const finalUsersMap = new Map<string, DanuserMapMarker>();
                newUsers.forEach(u => finalUsersMap.set(u.id, u));
                return Array.from(finalUsersMap.values());
            });
          }
        }, { 
            expand: 'danuser_related', 
            filter: `danuser_related != "${currentUserId}"`, 
        });
        console.log("[Map Page] Successfully subscribed to other users' location changes.");
      } catch (subError: any) {
          if (didCancelEffect) return;
          console.error("[Map Page] Failed to subscribe to location changes:", subError);
          toast({ title: "Realtime Connection Error", description: "Could not connect to live location updates for other users.", variant: "destructive"});
      }
    };
  
    fetchInitialAndSubscribe();
  
    return () => {
      didCancelEffect = true; 
      if (unsubscribeRealtime) {
        console.log("[Map Page] Unsubscribing from location changes due to effect cleanup.");
        unsubscribeRealtime();
      }
      pb.collection('danusin_users_location').unsubscribe(); 
      initialFetchInProgressRef.current = false; 
    };
  }, [user?.id, authLoading, toast]);


  const handleAllowLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => { 
          setLocationPermission("granted"); 
          setError(null); 
        },
        (err) => { 
          setLocationPermission(err.code === 1 ? "denied" : "prompt"); 
          setError(`Could not access location: ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } 
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLocationPermission("denied"); 
    }
  };

  const handleDenyLocation = () => {
    setLocationPermission("denied");
    setIsSharingLocation(false); 
  };

  const handleStartSharing = () => {
    if (locationPermission !== "granted") {
      toast({ title: "Location Access Required", description: "Please enable location permissions in your browser settings to start sharing.", variant: "destructive" });
      return;
    }
    if (!user) { 
        toast({ title: "Login Required", description: "Please log in to share your location.", variant: "default" });
        return;
    }
    if (isFetchingOwnRecordId) { 
        toast({ title: "Initializing...", description: "Please wait, checking your existing location status...", variant: "default"});
        return;
    }
    setError(null); 
    setIsSharingLocation(true); 
    toast({ title: "Location Sharing Started", description: "Your location is now being shared with other Danus.in users." });
  };
  
  const handleStopSharing = stableStopSharing; 


  const handleMapMarkerClick = (markerData: DanuserMapMarker) => {
    // Instead of toast, set the selected marker data to display the card
    setSelectedMarkerData(markerData);
  };

  const handleCloseMarkerCard = () => {
    setSelectedMarkerData(null);
  };


  // JSX Rendering
  if (authLoading || locationPermission === "loading" || (user && isFetchingOwnRecordId)) {
    let loadingText = "Initializing...";
    if (authLoading) loadingText = "Authenticating...";
    else if (locationPermission === "loading") loadingText = "Checking location permission...";
    else if (user && isFetchingOwnRecordId) loadingText = "Verifying your location status...";

    return (
        <main className="flex items-center justify-center h-screen bg-gray-100 dark:bg-zinc-950">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">{loadingText}</p>
        </main>
    );
  }

  if (locationPermission === "prompt") {
    return (
      <main className="container mx-auto p-4 flex justify-center items-center min-h-[calc(100vh-150px)]">
        <LocationPrompt onAllow={handleAllowLocation} onDeny={handleDenyLocation} />
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 relative"> {/* Added relative for potential absolute positioning of card */}
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">Danus.in Live Map</h1>
      
      {/* Selected Marker Info Card - Overlay */}
      {selectedMarkerData && (
        <div className="fixed inset-0 bg-zinc/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-xl dark:bg-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-gray-100">{selectedMarkerData.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCloseMarkerCard} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <XCircle className="h-6 w-6" />
              </Button>
            </CardHeader>
            <CardContent>
              {/* {selectedMarkerData.avatarUrl && ( // Example for avatar
                <img src={selectedMarkerData.avatarUrl} alt={selectedMarkerData.name} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover" />
              )} */}
              <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Username:</strong> {selectedMarkerData.username || 'N/A'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300"><strong>User ID:</strong> {selectedMarkerData.id}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Status:</strong> 
                <span className={selectedMarkerData.isActive ? "text-green-600 dark:text-green-400 ml-1" : "text-gray-500 dark:text-gray-400 ml-1"}>
                  {selectedMarkerData.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lat: {selectedMarkerData.lat.toFixed(5)}, Lon: {selectedMarkerData.lon.toFixed(5)}</p>
            </CardContent>
            {/* <CardFooter>
              Could add actions here, e.g., "View Profile" if applicable
            </CardFooter> */}
          </Card>
        </div>
      )}

      {error && ( 
        <Alert variant="destructive" className="mb-4">
          <WifiOff className="h-4 w-4" /> <AlertTitle>Error</AlertTitle> <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {locationPermission === "denied" && !isSharingLocation && ( 
        <Alert variant="warning" className="mb-4">
          <MapPinOff className="h-4 w-4" /> <AlertTitle>Location Access Denied</AlertTitle>
          <AlertDescription>To share your location and see others accurately, please enable location access in your browser settings for this site.</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Location Status Card */}
        <Card className="md:col-span-1 shadow-lg dark:bg-zinc-800">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Your Location Status</CardTitle>
            <CardDescription className="dark:text-gray-400">Manage your live location sharing.</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <>
                {locationPermission === "granted" ? (
                  isSharingLocation ? (
                    <div className="text-green-600 dark:text-green-400 flex items-center"><Info className="mr-2 h-4 w-4" /> Actively sharing your location.</div>
                  ) : (
                    <div className="text-gray-600 dark:text-gray-400 flex items-center"><Info className="mr-2 h-4 w-4" /> Not currently sharing your location.</div>
                  )
                ) : (
                  <div className="text-orange-600 dark:text-orange-400 flex items-center"><AlertCircle className="mr-2 h-4 w-4" /> Location permission not granted.</div>
                )}
                {displayedUserMapLocation && isSharingLocation && (
                   <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                     Current: Lat: {displayedUserMapLocation.lat.toFixed(5)}, Lon: {displayedUserMapLocation.lon.toFixed(5)}
                   </div>
                )}
                 {!user && <p className="text-red-500 dark:text-red-400">Please log in to use location features.</p>}
              </>
            ) : ( <p className="text-red-500 dark:text-red-400">Please log in to share your location.</p> )}
          </CardContent>
          <CardFooter>
            {isSharingLocation ? (
              <Button variant="destructive" className="w-full" onClick={handleStopSharing}>
                <StopCircle className="mr-2 h-4 w-4" /> Stop Sharing
              </Button>
            ) : (
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleStartSharing} disabled={locationPermission !== "granted" || !user || isFetchingOwnRecordId}>
                <Play className="mr-2 h-4 w-4" /> Start Sharing Location
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Map Card */}
        <Card className="md:col-span-2 shadow-lg dark:bg-zinc-800">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Live User Map</CardTitle> 
            <CardDescription className="dark:text-gray-400">See yourself and other active Danus.in users on the map.</CardDescription>
          </CardHeader>
          <CardContent className="p-0"> 
            <div className="h-[600px] w-full relative bg-gray-200 dark:bg-zinc-950 rounded-b-md overflow-hidden"> 
              {(showInitialLoadingOverlay && user?.id && !authLoading) && ( 
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-zinc/70 backdrop-blur-sm z-10">
                    <Users className="h-10 w-10 mb-3 text-blue-500" />
                    <p className="text-lg text-gray-700 dark:text-gray-300">Loading other users...</p>
                </div>
              )}
              <DanusinL7Map
                currentUserMapLocation={displayedUserMapLocation}
                otherUsersLocations={otherDanusers}
                isSharing={isSharingLocation}
                onMarkerClick={handleMapMarkerClick}
                initialCenter={SURABAYA_COORDS} 
                initialZoom={11}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
