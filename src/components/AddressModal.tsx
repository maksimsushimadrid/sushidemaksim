import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, ArrowRight, Loader2, Search, CheckCircle, Info, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../utils/api';
import { RESTAURANT_LOCATION, detectZone } from '../utils/delivery';
import { SearchSkeleton, MapPlaceholderSkeleton } from './skeletons/SearchSkeleton';

// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Premium Pin Icon for the restaurant (Red)
const SushiRestaurantIcon = L.divIcon({
    html: `
        <div class="relative flex flex-col-reverse items-center group">
            <div class="filter drop-shadow-lg transform transition-transform group-hover:scale-110">
                <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 0C8.954 0 0 8.954 0 20C0 35 20 50 20 50C20 50 40 35 40 20C40 8.954 31.046 0 20 0ZM20 28C15.582 28 12 24.418 12 20C12 15.582 15.582 12 20 12C24.418 12 28 15.582 28 20C28 24.418 24.418 28 20 28Z" fill="#F26522"/>
                    <circle cx="20" cy="20" r="6" fill="white" />
                </svg>
            </div>
            <div class="mb-1.5 px-3 py-1.5 bg-orange-600 text-white text-[10px] font-black rounded-xl shadow-xl whitespace-nowrap animate-in fade-in zoom-in duration-500 ring-4 ring-white/20">
                ¡Estamos aquí!
            </div>
        </div>
    `,
    className: '',
    iconSize: [40, 70],
    iconAnchor: [20, 65],
});

// Premium Pin Icon for the delivery point (Black)
const SushiDeliveryIcon = L.divIcon({
    html: `
        <div class="relative flex flex-col items-center group">
            <div class="filter drop-shadow-lg transform transition-transform group-hover:scale-110">
                <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 40 16 40C16 40 32 28 32 16C32 7.163 24.837 0 16 0ZM16 22.4C12.465 22.4 9.6 19.535 9.6 16C9.6 12.465 12.465 9.6 16 9.6C19.535 9.6 22.4 12.465 22.4 16C22.4 19.535 19.535 22.4 16 22.4Z" fill="#111827"/>
                    <circle cx="16" cy="16" r="4.8" fill="white" />
                </svg>
            </div>
            <div class="mt-1 px-2.5 py-1 bg-gray-900 text-white text-[10px] font-black rounded-lg shadow-lg whitespace-nowrap">
                ¡Aquí!
            </div>
        </div>
    `,
    className: '',
    iconSize: [32, 55],
    iconAnchor: [16, 50],
});

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: any) => void;
    deliveryZones: any[];
    currentAddress?: any;
}

function MapUpdater({
    center,
    zoom,
    isOpen,
}: {
    center: [number, number];
    zoom: number;
    isOpen: boolean;
}) {
    const map = useMap();
    const isFirstRenderRef = useRef(true);
    const lastProcessedCenterRef = useRef<[number, number]>(center);

    useEffect(() => {
        if (isOpen) {
            // Only invalidate size when modal opens
            const timer = setTimeout(() => {
                map.invalidateSize();
                if (isFirstRenderRef.current) {
                    map.setView(center, zoom, { animate: false });
                    isFirstRenderRef.current = false;
                    lastProcessedCenterRef.current = center;
                }
            }, 250);
            return () => clearTimeout(timer);
        } else {
            isFirstRenderRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, map]);

    useEffect(() => {
        if (isFirstRenderRef.current) return;

        // Skip automatic centering if the change is very small (likely from a marker drag)
        const dist = Math.sqrt(
            Math.pow(center[0] - lastProcessedCenterRef.current[0], 2) +
                Math.pow(center[1] - lastProcessedCenterRef.current[1], 2)
        );

        if (dist < 0.0001) return;

        const timer = setTimeout(() => {
            map.setView(center, zoom, { animate: true, duration: 0.5 });
            lastProcessedCenterRef.current = center;
        }, 50);
        return () => clearTimeout(timer);
    }, [center, zoom, map]);

    return null;
}

function LocationMarker({
    position,
    onDragEnd,
}: {
    position: [number, number];
    onDragEnd?: (lat: number, lon: number) => void;
}) {
    return position ? (
        <Marker
            position={position}
            icon={SushiDeliveryIcon}
            draggable={true}
            eventHandlers={{
                dragend: e => {
                    const marker = e.target;
                    const { lat, lng } = marker.getLatLng();
                    onDragEnd?.(lat, lng);
                },
            }}
        />
    ) : null;
}

function RestaurantMarker() {
    return <Marker position={RESTAURANT_LOCATION} icon={SushiRestaurantIcon} interactive={false} />;
}

export default function AddressModal({
    isOpen,
    onClose,
    onSelect,
    deliveryZones,
    currentAddress,
}: AddressModalProps) {
    const [markerPosition, setMarkerPosition] = useState<[number, number]>(
        currentAddress?.lat && currentAddress?.lon
            ? [currentAddress.lat, currentAddress.lon]
            : RESTAURANT_LOCATION
    );
    const [address, setAddress] = useState(currentAddress?.address || '');
    const [house, setHouse] = useState(currentAddress?.house || '');

    // Memoize delivery zones to prevent heavy re-renders during marker moves
    const renderedZones = useMemo(
        () =>
            deliveryZones.map(zone => {
                if (
                    zone.type === 'radius' ||
                    (zone.maxRadius > 0 && (!zone.coordinates || zone.coordinates.length < 3))
                ) {
                    return (
                        <Circle
                            key={zone.id}
                            center={RESTAURANT_LOCATION}
                            radius={zone.maxRadius * 1000}
                            interactive={false}
                            pathOptions={{
                                color: zone.color,
                                fillColor: zone.color,
                                fillOpacity: 0.05,
                                weight: 1.5,
                                dashArray: '5, 10',
                            }}
                        />
                    );
                }
                if (
                    zone.coordinates &&
                    Array.isArray(zone.coordinates) &&
                    zone.coordinates.length >= 3
                ) {
                    return (
                        <Polygon
                            key={zone.id}
                            positions={zone.coordinates}
                            interactive={false}
                            pathOptions={{
                                color: zone.color,
                                fillColor: zone.color,
                                fillOpacity: 0.1,
                                weight: 2,
                            }}
                        />
                    );
                }
                return null;
            }),
        [deliveryZones]
    );
    const [apartment, setApartment] = useState(currentAddress?.apartment || '');
    const [postalCode, setPostalCode] = useState(currentAddress?.postalCode || '');
    const [selectedZone, setSelectedZone] = useState<any>(null);

    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAddressManuallyEdited, setIsAddressManuallyEdited] = useState(false);

    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [mapZoom, setMapZoom] = useState(window.innerWidth < 768 ? 14 : 15);
    const skipNextReverseGeocodeRef = useRef(false);
    const skipNextSearchRef = useRef(false);
    const wasSelectedViaSearchRef = useRef(false);
    const prevOpenRef = useRef(isOpen);
    const [isLocatingAddress, setIsLocatingAddress] = useState(false);
    const [isSearchFullscreen, setIsSearchFullscreen] = useState(false);
    const [isGeolocating, setIsGeolocating] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const houseInputRef = useRef<HTMLInputElement>(null);
    const apartmentInputRef = useRef<HTMLInputElement>(null);

    // Sync internal state with props when modal OPENS
    useEffect(() => {
        if (isOpen && !prevOpenRef.current) {
            // Modal is opening, sync internal form states with current selected address
            const streetVal = currentAddress?.address || '';
            const houseVal = currentAddress?.house || '';
            setAddress(streetVal);
            setHouse(houseVal);
            setApartment(currentAddress?.apartment || '');
            setPostalCode(currentAddress?.postalCode || '');

            // NEW: If an address is ALREADY selected, protect it from being overwritten by reverse geocode
            if (streetVal) {
                wasSelectedViaSearchRef.current = true;
                skipNextReverseGeocodeRef.current = true;
            } else {
                wasSelectedViaSearchRef.current = false;
                skipNextReverseGeocodeRef.current = false;
            }

            if (currentAddress?.lat && currentAddress?.lon) {
                setMarkerPosition([currentAddress.lat, currentAddress.lon]);
                setMapZoom(18);
                setIsLocatingAddress(false);
            } else if (streetVal) {
                // Address has no coordinates in profile? Auto-geocode it!
                setIsLocatingAddress(true);
                const q = `${streetVal} ${houseVal}, Madrid`.trim();
                skipNextReverseGeocodeRef.current = true;
                api.get(`/delivery-zones/search?q=${encodeURIComponent(q)}`)
                    .then(data => {
                        if (data && data.length > 0) {
                            const best = data[0];
                            const lat = parseFloat(best.lat);
                            const lon = parseFloat(best.lon);
                            if (!isNaN(lat) && !isNaN(lon)) {
                                skipNextReverseGeocodeRef.current = true;
                                setMarkerPosition([lat, lon]);
                                setMapZoom(18);
                            }
                        }
                    })
                    .finally(() => {
                        setIsLocatingAddress(false);
                    });
                setMarkerPosition(RESTAURANT_LOCATION); // Fallback until search returns
                setMapZoom(15);
            } else {
                setMarkerPosition(RESTAURANT_LOCATION);
                setMapZoom(window.innerWidth < 768 ? 14 : 15);
                setIsLocatingAddress(false);
            }
        }
        prevOpenRef.current = isOpen;
    }, [isOpen, currentAddress]);

    const isMarkerAtRestaurant =
        Math.abs(markerPosition[0] - RESTAURANT_LOCATION[0]) < 0.0005 &&
        Math.abs(markerPosition[1] - RESTAURANT_LOCATION[1]) < 0.0005;

    useEffect(() => {
        // Only detect zone if not "fake" restaurant location
        const isFakeLocation =
            isMarkerAtRestaurant && isAddressManuallyEdited && !wasSelectedViaSearchRef.current;

        if (isFakeLocation) {
            setSelectedZone(null);
        } else {
            const detected = detectZone(markerPosition[0], markerPosition[1], deliveryZones);
            setSelectedZone(detected);
        }
    }, [markerPosition, deliveryZones, isMarkerAtRestaurant, isAddressManuallyEdited]);
    const handleContinueWithValues = useCallback(
        (
            finalAddress: string,
            finalHouse: string,
            finalApartment: string,
            finalPostalCode: string,
            finalZone: any,
            finalCoords: [number, number]
        ) => {
            // Safari Sync Hack
            [houseInputRef, apartmentInputRef].forEach(ref => {
                if (ref.current) {
                    ref.current.focus();
                    ref.current.blur();
                }
            });

            if (!finalZone) return;

            onSelect({
                address: finalAddress,
                house: finalHouse,
                apartment: finalApartment,
                postalCode: finalPostalCode,
                zone: finalZone,
                coordinates: finalCoords,
            });
            onClose();
        },
        [onSelect, onClose]
    );

    const performReverseGeocode = useCallback(
        async (lat?: number, lon?: number) => {
            if (skipNextReverseGeocodeRef.current) {
                skipNextReverseGeocodeRef.current = false;
                return;
            }

            const targetLat = lat ?? markerPosition[0];
            const targetLon = lon ?? markerPosition[1];

            setIsReverseGeocoding(true);
            try {
                const data = await api.get(
                    `/delivery-zones/reverse?lat=${targetLat}&lon=${targetLon}`
                );
                if (data && data.address) {
                    const street =
                        data.address.road ||
                        data.address.pedestrian ||
                        data.address.suburb ||
                        data.address.neighbourhood ||
                        data.address.city ||
                        '';
                    const houseNum = data.address.house_number || '';

                    // Only overwrite address/house if currently empty
                    // AND NOT if we just selected something precisely via search or opened from profile
                    const isDefaultLoc =
                        Math.abs(targetLat - RESTAURANT_LOCATION[0]) < 0.001 &&
                        Math.abs(targetLon - RESTAURANT_LOCATION[1]) < 0.001;

                    if (!address && !wasSelectedViaSearchRef.current && !isDefaultLoc) {
                        setAddress(street || data.display_name?.split(',')[0] || '');
                    }

                    if (!house && !wasSelectedViaSearchRef.current && !isDefaultLoc) {
                        setHouse(houseNum);
                    }

                    if (data.address.postcode) setPostalCode(data.address.postcode);
                }
            } catch (error) {
                console.error('Reverse geocode error:', error);
            } finally {
                setIsReverseGeocoding(false);
            }
        },
        [address, house, markerPosition]
    );

    const selectResult = useCallback(
        async (res: any, queryHint?: string, autoConfirm = false) => {
            const lat = parseFloat(res.lat);
            const lon = parseFloat(res.lon);

            if (isNaN(lat) || isNaN(lon)) return;

            skipNextReverseGeocodeRef.current = true;
            skipNextSearchRef.current = true;

            setSearchResults([]);
            setIsSearching(false);
            setSearchQuery('');
            setIsSearchFullscreen(false);
            searchInputRef.current?.blur();

            const newPos: [number, number] = [lat, lon];
            setMarkerPosition(newPos);
            wasSelectedViaSearchRef.current = true;
            setIsAddressManuallyEdited(false);

            let street =
                res.address?.road ||
                res.address?.pedestrian ||
                res.display_name?.split(',')[0] ||
                '';
            let houseNum = res.address?.house_number || '';

            // Advanced Extraction: If house_number is missing in response object but present in display_name
            if (!houseNum && res.display_name) {
                const displayNameParts = res.display_name.split(',');
                const firstPart = displayNameParts[0]?.trim() || '';

                if (/^\d+[a-zA-Z]?$/.test(firstPart)) {
                    houseNum = firstPart;
                    street = displayNameParts[1]?.trim() || street;
                } else {
                    const match = firstPart.match(/(.+?)\s+(\d+[a-zA-Z]?)$/);
                    if (match) {
                        street = match[1].trim();
                        houseNum = match[2];
                    }
                }
            }

            const pc = res.address?.postcode || res.display_name?.match(/\b\d{5}\b/)?.[0] || '';

            const originalResultHouseNum = res.address?.house_number || '';
            setAddress(street);

            // If we have a query hint with a number, and the result's house number is missing or different,
            // try to extract the number from the query hint.
            if (queryHint) {
                const numInQuery = queryHint.match(/\b\d+[a-zA-Z]?\b/)?.[0];
                if (numInQuery && (!houseNum || houseNum !== numInQuery)) {
                    houseNum = numInQuery;
                }
            }

            setHouse(houseNum);
            setApartment(''); // Clear apartment when a NEW address is selected to avoid '3a' ghosting
            if (pc) setPostalCode(pc);
            setMapZoom(18);

            // DETECT ZONE IMMEDIATELY for autoConfirm logic
            const currentZone = detectZone(lat, lon, deliveryZones, pc);
            setSelectedZone(currentZone);

            // REFINEMENT: If the house number we found/hinted is different from the original search result,
            // we must re-geocode to move the marker to the EXACT house.
            if (houseNum && (houseNum !== originalResultHouseNum || !originalResultHouseNum)) {
                const fullQuery = `${street} ${houseNum}, ${pc || 'Madrid'}`.trim();
                try {
                    const data = await api.get(
                        `/delivery-zones/search?q=${encodeURIComponent(fullQuery)}`
                    );
                    if (data && data.length > 0) {
                        const best = data[0];
                        const rLat = parseFloat(best.lat);
                        const rLon = parseFloat(best.lon);
                        if (!isNaN(rLat) && !isNaN(rLon)) {
                            skipNextReverseGeocodeRef.current = true;
                            setMarkerPosition([rLat, rLon]);

                            // Re-detect zone with refined coordinates
                            const refinedZone = detectZone(rLat, rLon, deliveryZones, pc);
                            setSelectedZone(refinedZone);

                            if (autoConfirm && refinedZone) {
                                // Short delay to allow state to settle visually
                                setTimeout(() => {
                                    handleContinueWithValues(
                                        street,
                                        houseNum,
                                        '',
                                        pc,
                                        refinedZone,
                                        [rLat, rLon]
                                    );
                                }, 300);
                            }
                        } else if (autoConfirm && currentZone) {
                            handleContinueWithValues(street, houseNum, '', pc, currentZone, newPos);
                        }
                    } else if (autoConfirm && currentZone) {
                        handleContinueWithValues(street, houseNum, '', pc, currentZone, newPos);
                    }
                } catch (e) {
                    console.error('Refinement failed', e);
                    if (autoConfirm && currentZone) {
                        handleContinueWithValues(street, houseNum, '', pc, currentZone, newPos);
                    }
                }
            } else if (autoConfirm && currentZone) {
                handleContinueWithValues(street, houseNum, '', pc, currentZone, newPos);
            }
        },
        [deliveryZones, handleContinueWithValues]
    );

    const performSearch = useCallback(
        async (query: string, selectFirst = false, autoConfirm = false) => {
            if (query.trim().length < 3) {
                setSearchResults([]);
                return;
            }

            setSearchResults([]);
            setIsSearching(true);
            try {
                const data = await api.get(`/delivery-zones/search?q=${encodeURIComponent(query)}`);
                setSearchResults(data || []);

                if (selectFirst && data && data.length > 0) {
                    selectResult(data[0], query, autoConfirm);
                }
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setIsSearching(false);
            }
        },
        [selectResult]
    );

    useEffect(() => {
        // Don't trigger search if modal is closed, or query is exactly the selected street
        if (!isOpen || searchQuery === address || skipNextSearchRef.current) {
            if (searchQuery === address) {
                setSearchResults([]);
            }
            skipNextSearchRef.current = false;
            return;
        }

        // Reset the "selected via search" flag if user starts typing a new query
        if (searchQuery.trim().length >= 1 && searchQuery !== address) {
            wasSelectedViaSearchRef.current = false;
        }

        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 3) {
                performSearch(searchQuery.trim());
            } else if (searchQuery.trim().length === 0) {
                setSearchResults([]);
                wasSelectedViaSearchRef.current = false;
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, address, performSearch, isOpen]);

    useEffect(() => {
        if (isOpen && !currentAddress?.address) {
            performReverseGeocode();
        }
    }, [isOpen, currentAddress?.address, performReverseGeocode]);

    useEffect(() => {
        if (!isOpen || isNaN(markerPosition[0]) || isNaN(markerPosition[1])) return;

        const isDefault =
            Math.abs(markerPosition[0] - RESTAURANT_LOCATION[0]) < 0.0001 &&
            Math.abs(markerPosition[1] - RESTAURANT_LOCATION[1]) < 0.0001;

        if (isDefault) return;
        if (skipNextReverseGeocodeRef.current) {
            skipNextReverseGeocodeRef.current = false;
            return;
        }

        const timer = setTimeout(() => {
            performReverseGeocode(markerPosition[0], markerPosition[1]);
        }, 1200);

        return () => clearTimeout(timer);
    }, [markerPosition, performReverseGeocode, isOpen]);

    const handleContinue = () => {
        const finalHouse = (houseInputRef.current?.value || house).trim();
        const finalApartment = (apartmentInputRef.current?.value || apartment).trim();

        handleContinueWithValues(
            address,
            finalHouse,
            finalApartment,
            postalCode,
            selectedZone,
            markerPosition
        );
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchQuery.trim().length >= 3) {
                performSearch(searchQuery.trim(), true);
            }
        }
        if (e.key === 'Escape') {
            setIsSearchFullscreen(false);
            searchInputRef.current?.blur();
        }
    };

    const handleGeolocate = useCallback(() => {
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta la geolocalización.');
            return;
        }
        setIsGeolocating(true);
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude, longitude } = pos.coords;
                skipNextReverseGeocodeRef.current = false;
                wasSelectedViaSearchRef.current = false;
                setMarkerPosition([latitude, longitude]);
                setMapZoom(18);
                setAddress('');
                setHouse('');
                setIsAddressManuallyEdited(false);
                setIsGeolocating(false);
                setIsSearchFullscreen(false);
                setSearchQuery('');
                setSearchResults([]);
                // Trigger reverse geocode to fill address fields
                performReverseGeocode(latitude, longitude);
            },
            err => {
                console.error('Geolocation error:', err);
                setIsGeolocating(false);
                // Provide user feedback on failure (e.g. denied permission or timeout)
                if (err.code === err.PERMISSION_DENIED) {
                    alert(
                        'Por favor, permite el acceso a tu ubicación en los ajustes del navegador y de tu sistema operativo.'
                    );
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    alert(
                        'No se pudo determinar tu ubicación. Asegúrate de tener activados los servicios de localización y el Wi-Fi en los ajustes de tu dispositivo, o introduce tu dirección manualmente.'
                    );
                } else if (err.code === err.TIMEOUT) {
                    alert(
                        'Se agotó el tiempo de espera para obtener tu ubicación. Por favor, inténtalo de nuevo o introduce tu dirección manualmente.'
                    );
                } else {
                    alert(
                        'No pudimos detectar tu ubicación. Por favor, intenta buscar tu calle manualmente.'
                    );
                }
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
    }, [performReverseGeocode]);

    // Autofocus search when modal opens without an address
    useEffect(() => {
        if (isOpen && !currentAddress?.address) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 600); // Wait for spring animation
        }
    }, [isOpen, currentAddress?.address]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (isSearchFullscreen) {
                setIsSearchFullscreen(false);
                return;
            }
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, isSearchFullscreen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-backdrop"
                    />

                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                        className="fixed inset-0 md:inset-auto md:top-12 md:bottom-12 md:left-0 md:right-0 bg-white z-modal h-[100dvh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col md:max-w-5xl md:mx-auto md:rounded-[32px] shadow-3xl"
                    >
                        {/* Header (Desktop only) */}
                        <div className="hidden md:flex px-6 py-4 justify-between items-start border-b border-gray-100 shrink-0 relative bg-white z-20">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    <MapPin size={18} className="text-orange-500" />
                                    ¿Dónde entregamos?
                                </h2>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">
                                    Selecciona tu ubicación en el mapa
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-900 transition-all hover:bg-gray-50 rounded-lg"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
                            {/* Mobile Close Button */}
                            <button
                                onClick={onClose}
                                className="md:hidden absolute top-safe-top right-4 mt-4 w-10 h-10 bg-white/90 backdrop-blur-md shadow-xl rounded-full flex items-center justify-center text-gray-900 active:scale-95 transition z-[1001]"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>

                            {/* Map Side */}
                            <div
                                className="flex-1 md:flex-1 relative bg-gray-100 border-r border-gray-100 shrink-0"
                                onClick={() => {
                                    // Close search dropdown when tapping on the map area
                                    if (searchResults.length > 0) {
                                        setSearchResults([]);
                                    }
                                    if (isSearchFullscreen) {
                                        setIsSearchFullscreen(false);
                                    }
                                }}
                            >
                                <MapContainer
                                    center={markerPosition}
                                    zoom={window.innerWidth < 768 ? 14 : 15}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                    attributionControl={false}
                                    preferCanvas={true}
                                >
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                    <MapUpdater
                                        center={
                                            !isNaN(markerPosition[0])
                                                ? markerPosition
                                                : RESTAURANT_LOCATION
                                        }
                                        zoom={mapZoom}
                                        isOpen={isOpen}
                                    />

                                    {/* Static Restaurant Marker */}
                                    <RestaurantMarker />

                                    {/* Dynamic User Location Marker (draggable) */}
                                    <LocationMarker
                                        position={markerPosition}
                                        onDragEnd={(lat, lon) => {
                                            wasSelectedViaSearchRef.current = false;
                                            skipNextReverseGeocodeRef.current = false;
                                            setMarkerPosition([lat, lon]);
                                            setMapZoom(18);
                                            // Clear street/house so reverse geocode fills them
                                            setAddress('');
                                            setHouse('');
                                            setIsAddressManuallyEdited(false);
                                        }}
                                    />

                                    {/* Delivery Zones - Memoized to prevent jank on marker moves */}
                                    {renderedZones}
                                </MapContainer>

                                <AnimatePresence>
                                    {!markerPosition && <MapPlaceholderSkeleton />}
                                    {isLocatingAddress && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-[40] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                                        >
                                            <div className="w-16 h-16 bg-orange-600 rounded-2xl shadow-xl flex items-center justify-center mb-4 animate-bounce">
                                                <MapPin size={24} className="text-white" />
                                            </div>
                                            <h4 className="text-sm font-black text-gray-900 mb-1">
                                                Localizando dirección...
                                            </h4>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                Calculando ruta de entrega
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Search Overlay — fullscreen on mobile when focused */}
                                <div
                                    className={`absolute z-[1000] transition-all duration-300 ${
                                        isSearchFullscreen
                                            ? 'inset-0 bg-white/98 backdrop-blur-xl flex flex-col p-4 pt-14 md:top-6 md:left-6 md:right-6 md:bottom-auto md:bg-transparent md:backdrop-blur-none md:p-0'
                                            : 'top-6 left-6 right-16 md:top-6 md:left-6 md:right-6'
                                    }`}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Fullscreen close button (mobile) */}
                                    {isSearchFullscreen && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsSearchFullscreen(false);
                                                searchInputRef.current?.blur();
                                            }}
                                            className="md:hidden absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 z-10"
                                        >
                                            <X size={20} strokeWidth={2.5} />
                                        </button>
                                    )}

                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 transition-colors z-10">
                                            {isSearching ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Search size={18} strokeWidth={2.5} />
                                            )}
                                        </div>
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={handleSearchKeyDown}
                                            onFocus={() => {
                                                if (window.innerWidth < 768) {
                                                    setIsSearchFullscreen(true);
                                                }
                                            }}
                                            placeholder="Escribe tu calle y número..."
                                            autoComplete="off"
                                            spellCheck={false}
                                            className="w-full bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.15)] rounded-2xl pl-12 pr-12 py-3.5 md:py-4 text-[15px] font-black border-none outline-none ring-2 ring-orange-500/20 focus:ring-orange-600 transition-all placeholder:text-gray-400 placeholder:font-bold"
                                        />
                                        {/* Clear button */}
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setSearchResults([]);
                                                    searchInputRef.current?.focus();
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
                                            >
                                                <X
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="text-gray-500"
                                                />
                                            </button>
                                        )}
                                    </div>

                                    {/* Results dropdown */}
                                    <AnimatePresence>
                                        {(isSearching ||
                                            searchResults.length > 0 ||
                                            (searchQuery.trim().length >= 3 &&
                                                searchQuery !== address)) && (
                                            <div
                                                data-lenis-prevent
                                                className={`${
                                                    isSearchFullscreen
                                                        ? 'mt-3 flex-1 overflow-y-auto rounded-2xl bg-white border border-gray-100 divide-y divide-gray-50'
                                                        : 'absolute top-full mt-2 left-0 right-0 bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-gray-100 overflow-y-auto max-h-[200px] md:max-h-[440px] divide-y divide-gray-50'
                                                } animate-in fade-in slide-in-from-top-2 duration-200 z-[1001] custom-scrollbar`}
                                            >
                                                {isSearching && <SearchSkeleton count={3} />}

                                                {searchResults.map((res, i) => {
                                                    const queryNum =
                                                        searchQuery.match(
                                                            /\b(\d+[a-zA-Z]?)\s*$/
                                                        )?.[1] ||
                                                        searchQuery.match(
                                                            /^(\d+[a-zA-Z]?)\s/
                                                        )?.[1] ||
                                                        '';
                                                    const hasOwnHouse = !!res.address?.house_number;
                                                    const displayHouse = hasOwnHouse
                                                        ? res.address.house_number
                                                        : queryNum;

                                                    return (
                                                        <button
                                                            key={i}
                                                            onPointerDown={e => {
                                                                e.preventDefault();
                                                                selectResult(res, searchQuery);
                                                                setIsSearchFullscreen(false);
                                                            }}
                                                            className="w-full px-4 py-3.5 text-left hover:bg-orange-50 transition flex items-center gap-3 group"
                                                        >
                                                            <div className="w-9 h-9 rounded-xl bg-gray-50 group-hover:bg-orange-100 flex items-center justify-center shrink-0 transition-colors">
                                                                <MapPin
                                                                    size={16}
                                                                    strokeWidth={2}
                                                                    className="text-gray-400 group-hover:text-orange-600 transition-colors"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-black text-gray-900 truncate">
                                                                    {res.address?.road ||
                                                                        res.display_name.split(
                                                                            ','
                                                                        )[0]}
                                                                    {displayHouse &&
                                                                        `, ${displayHouse}`}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                                                    {res.address?.city ||
                                                                        res.address?.town ||
                                                                        res.address?.village ||
                                                                        res.address?.suburb ||
                                                                        'Comunidad de Madrid'}
                                                                    {res.address?.postcode &&
                                                                        ` • ${res.address.postcode}`}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}

                                                {/* No results message */}
                                                {!isSearching &&
                                                    searchResults.length === 0 &&
                                                    searchQuery.trim().length >= 3 &&
                                                    searchQuery !== address && (
                                                        <div className="p-8 text-center bg-gray-50/50">
                                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                <Search
                                                                    size={20}
                                                                    className="text-gray-300"
                                                                />
                                                            </div>
                                                            <p className="text-sm font-black text-gray-900 tracking-tight">
                                                                No encontramos resultados
                                                            </p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                                Intenta añadir el número o revisa el
                                                                nombre
                                                            </p>
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </AnimatePresence>

                                    {/* Geolocation shortcut inside fullscreen search */}
                                    {isSearchFullscreen && !searchQuery && (
                                        <button
                                            type="button"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleGeolocate();
                                            }}
                                            disabled={isGeolocating}
                                            className="mt-4 w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all active:scale-[0.98] group"
                                        >
                                            <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors">
                                                {isGeolocating ? (
                                                    <Loader2
                                                        size={20}
                                                        className="animate-spin text-orange-600"
                                                    />
                                                ) : (
                                                    <Crosshair
                                                        size={20}
                                                        className="text-orange-600"
                                                    />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-gray-900 tracking-tight">
                                                    Usar mi ubicación actual
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    Detectar automáticamente
                                                </p>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Form Side */}
                            <div className="w-full md:w-[380px] bg-white flex flex-col flex-1 min-h-0 overflow-hidden border-l border-gray-100">
                                <div className="flex-1 overflow-y-auto px-3 py-1 md:px-5 md:py-4 space-y-1 md:space-y-3 scrollbar-hide">
                                    <div
                                        onClick={() => {
                                            searchInputRef.current?.focus();
                                            if (window.innerWidth < 768) {
                                                setIsSearchFullscreen(true);
                                            }
                                        }}
                                        className="cursor-pointer group"
                                    >
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 md:mb-1.5 px-1 tracking-widest leading-none">
                                            Calle / Avenida *
                                        </label>
                                        <div className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2 md:py-3.5 text-[14px] font-bold text-gray-900 transition-all flex items-center gap-2 group-hover:bg-gray-100 min-h-[36px] md:min-h-[46px]">
                                            {address ? (
                                                <span
                                                    className="truncate text-[14px] font-bold"
                                                    data-testid="selected-address-name"
                                                >
                                                    {address}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-[14px] font-bold">
                                                    Busca tu calle en el mapa ↑
                                                </span>
                                            )}
                                            <Search
                                                size={14}
                                                className="ml-auto text-gray-300 shrink-0 group-hover:text-orange-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                                        {/* Number - EDITABLE */}
                                        <div className="flex flex-col">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 md:mb-1.5 px-1 tracking-widest leading-none truncate">
                                                Número *
                                            </label>
                                            <input
                                                type="text"
                                                value={house}
                                                ref={houseInputRef}
                                                onChange={e => setHouse(e.target.value)}
                                                className={`w-full bg-gray-50 border-none rounded-xl px-3 py-2 md:py-3.5 text-[14px] font-bold text-gray-900 outline-none transition-all placeholder:text-gray-400 placeholder:font-bold ${
                                                    address && !house
                                                        ? 'ring-2 ring-red-500 bg-red-50 animate-pulse'
                                                        : 'focus:ring-2 ring-orange-500/10'
                                                }`}
                                                placeholder="Ej: 20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 md:mb-1.5 px-1 tracking-widest leading-none truncate">
                                                Piso
                                            </label>
                                            <input
                                                value={apartment}
                                                ref={apartmentInputRef}
                                                onChange={e => setApartment(e.target.value)}
                                                className="w-full bg-gray-50 rounded-xl px-3 py-2 md:py-3.5 text-[14px] font-bold text-gray-900 border-none focus:ring-2 ring-orange-500/10 transition outline-none placeholder:text-gray-400 placeholder:font-bold"
                                                placeholder="Ej: 1B"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 md:mb-1.5 px-1 tracking-widest leading-none truncate">
                                                C. Postal
                                            </label>
                                            <input
                                                value={postalCode}
                                                onChange={e => {
                                                    setPostalCode(e.target.value);
                                                    setIsAddressManuallyEdited(true);
                                                }}
                                                className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 md:py-3.5 text-[14px] font-bold text-gray-900 outline-none focus:ring-2 ring-orange-500/10 transition-all placeholder:text-gray-400 placeholder:font-bold"
                                                placeholder="28001"
                                            />
                                        </div>
                                    </div>

                                    {/* Zone Status */}
                                    <div className="pt-0.5">
                                        {isMarkerAtRestaurant &&
                                        isAddressManuallyEdited &&
                                        !wasSelectedViaSearchRef.current ? (
                                            <div className="flex items-center gap-3 py-3 px-3 bg-red-50 border border-red-100 rounded-2xl animate-in shake duration-500">
                                                <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                                                    <MapPin
                                                        className="text-white"
                                                        size={18}
                                                        strokeWidth={3}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-red-900 tracking-tight leading-tight">
                                                        Ubicación no confirmada
                                                    </p>
                                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-tighter mt-0.5">
                                                        Selecciona tu calle de la lista o mueve el
                                                        pin en el mapa
                                                    </p>
                                                </div>
                                            </div>
                                        ) : selectedZone ? (
                                            <div className="p-2.5 md:p-4 bg-green-50/50 rounded-2xl md:rounded-3xl border border-green-100/50 animate-in slide-in-from-bottom-3 duration-500">
                                                {/* Mobile Row Layout */}
                                                <div className="md:hidden flex items-center justify-between py-0.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <CheckCircle
                                                            className="text-green-600 shrink-0"
                                                            size={14}
                                                            strokeWidth={3}
                                                        />
                                                        <span className="text-sm font-black text-gray-900 truncate">
                                                            {selectedZone.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] font-black text-gray-500 bg-white/50 px-2 py-1 rounded-lg">
                                                        <span className="flex items-center gap-1">
                                                            {selectedZone.cost === 0
                                                                ? 'GRATIS'
                                                                : `${selectedZone.cost}€`}
                                                            <span className="text-[10px] opacity-40">
                                                                Envío
                                                            </span>
                                                        </span>
                                                        <div className="w-1 h-1 rounded-full bg-gray-200" />
                                                        <span className="flex items-center gap-1">
                                                            {selectedZone.minOrder}€
                                                            <span className="text-[10px] opacity-40">
                                                                Mín
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Desktop Full Layout */}
                                                <div className="hidden md:block">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                                                            <CheckCircle
                                                                className="text-green-600 w-[22px] h-[22px]"
                                                                strokeWidth={2.5}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-xl font-black text-gray-900 leading-tight">
                                                                    {selectedZone.name}
                                                                </h3>
                                                                <span className="text-[10px] font-black text-green-700 bg-green-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                                    DISPONIBLE
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] font-bold text-green-600/80 uppercase tracking-widest mt-0.5">
                                                                Zona de entrega detectada
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-green-100/30 flex flex-col h-full">
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-tight min-h-[20px]">
                                                                Envío
                                                            </p>
                                                            <p className="text-[17px] font-black text-gray-900 mt-auto leading-none">
                                                                {selectedZone.cost === 0
                                                                    ? 'GRATIS'
                                                                    : `${selectedZone.cost}€`}
                                                            </p>
                                                        </div>
                                                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-green-100/30 flex flex-col h-full">
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-tight min-h-[20px]">
                                                                Pedido mín.
                                                            </p>
                                                            <p className="text-[17px] font-black text-gray-900 mt-auto leading-none">
                                                                {selectedZone.minOrder}€
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 py-2 px-1 animate-in shake duration-500">
                                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                                                    <Info className="text-orange-500" size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-orange-900 tracking-tight">
                                                        Zona no cubierta
                                                    </p>
                                                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter">
                                                        Prueba con otra dirección o número
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sticky Footer with Gradient */}
                                <div className="p-3 md:p-5 bg-white border-t border-gray-50 relative pb-6 md:pb-6 shrink-0">
                                    <div className="absolute bottom-full left-0 right-0 h-4 md:h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />

                                    {/* Manual Edit Warning */}
                                    <AnimatePresence>
                                        {address && !house && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 shadow-sm"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Info size={18} className="text-white" />
                                                </div>
                                                <p className="text-[11px] font-black text-red-900 leading-tight">
                                                    DATO NECESARIO:{' '}
                                                    <span className="opacity-70 font-bold block uppercase tracking-tighter mt-0.5">
                                                        Para una ubicación exacta, mueve el marcador
                                                        sobre tu casa o añade el número.
                                                    </span>
                                                </p>
                                            </motion.div>
                                        )}

                                        {isAddressManuallyEdited && house && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 shadow-sm"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                                    <MapPin size={18} className="text-white" />
                                                </div>
                                                <p className="text-[11px] font-black text-amber-900 leading-tight">
                                                    CALLE EDITADA:{' '}
                                                    <span className="opacity-70 font-bold block uppercase tracking-tighter mt-0.5">
                                                        El envío se basa en el mapa. ¡Asegúrate de
                                                        colocar el PIN correctamente!
                                                    </span>
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        onClick={handleContinue}
                                        disabled={
                                            !address ||
                                            !house ||
                                            !selectedZone ||
                                            isReverseGeocoding
                                        }
                                        className="w-full py-3.5 bg-orange-600 text-white rounded-[20px] font-black text-base flex items-center justify-center gap-3 hover:bg-orange-700 transition transform active:scale-95 disabled:grayscale disabled:opacity-30 shadow-[0_15px_30px_-10px_rgba(242,101,34,0.3)]"
                                    >
                                        {isReverseGeocoding ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Actualizando...
                                            </span>
                                        ) : (
                                            <>
                                                Confirmar dirección <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
