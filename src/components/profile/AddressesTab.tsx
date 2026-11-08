import { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Star, Trash2, Pencil, X, Loader2, ArrowRight, Search } from 'lucide-react';

import { UserAddress } from '../../types';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { detectZone } from '../../utils/delivery';
import DeleteConfirmationModal from '../admin/DeleteConfirmationModal';

interface AddressSuggestion {
    display_name: string;
    address: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        postcode?: string;
        suburb?: string;
        state?: string;
        neighbourhood?: string;
    };
    lat: string;
    lon: string;
}

interface Props {
    addresses: UserAddress[];
    deliveryZones: any[];
    addAddress: (data: any) => Promise<void>;
    editAddress?: (id: string, data: any) => Promise<void>;
    removeAddress: (id: string) => Promise<void>;
    setDefaultAddress: (id: string) => Promise<void>;
}

export default function AddressesTab({
    addresses,
    deliveryZones,
    addAddress,
    editAddress,
    removeAddress,
    setDefaultAddress,
}: Props) {
    const { success, error } = useToast();
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [newAddress, setNewAddress] = useState({
        label: '',
        street: '',
        house: '',
        apartment: '',
        city: 'Madrid',
        postalCode: '',
        phone: '',
        isDefault: false,
        lat: undefined as number | undefined,
        lon: undefined as number | undefined,
    });

    const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const [isSearching, setIsSearching] = useState(false);
    const ignoreNextSearchRef = useRef(false);
    const wasSelectedViaSearchRef = useRef(false);

    // Form Refs for reliable Safari capture
    const labelRef = useRef<HTMLInputElement>(null);
    const streetRef = useRef<HTMLInputElement>(null);
    const houseRef = useRef<HTMLInputElement>(null);
    const apartmentRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const isSubmitting = useRef(false);

    // Debounced Nominatim search
    useEffect(() => {
        if (ignoreNextSearchRef.current) {
            ignoreNextSearchRef.current = false;
            return;
        }

        if (searchQuery.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const data = await api.get(
                    `/delivery-zones/search?q=${encodeURIComponent(searchQuery)}`
                );
                setSuggestions(data || []);
                setShowSuggestions((data || []).length > 0);
            } catch {
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSelectSuggestion = (
        s: AddressSuggestion,
        queryHint?: string,
        autoConfirm = false
    ) => {
        let street = s.address?.road || s.display_name.split(',')[0] || '';
        let houseNum = s.address?.house_number || '';

        // Advanced Extraction from display_name
        if (!houseNum && s.display_name) {
            const displayNameParts = s.display_name.split(',');
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

        // Try extract from query hint
        if (queryHint) {
            const numInQuery = queryHint.match(/\b\d+[a-zA-Z]?\b/)?.[0];
            if (numInQuery && (!houseNum || houseNum !== numInQuery)) {
                houseNum = numInQuery;
            }
        }

        const city =
            s.address?.city ||
            s.address?.town ||
            s.address?.village ||
            s.address?.suburb ||
            'Comunidad de Madrid';
        const postalCode = s.address?.postcode || s.display_name?.match(/\b\d{5}\b/)?.[0] || '';

        const lat = s.lat ? parseFloat(s.lat) : undefined;
        const lon = s.lon ? parseFloat(s.lon) : undefined;

        // Detect Zone
        const zone = detectZone(lat, lon, deliveryZones, postalCode);

        setNewAddress(p => ({
            ...p,
            street,
            house: houseNum,
            city,
            postalCode,
            apartment: '',
            lat,
            lon,
        }));
        ignoreNextSearchRef.current = true;
        setSearchQuery(street);
        wasSelectedViaSearchRef.current = true;
        setShowSuggestions(false);
        setSuggestions([]);

        // Sync refs immediately
        setTimeout(() => {
            if (houseRef.current) houseRef.current.value = houseNum;
        }, 0);

        if (autoConfirm) {
            if (zone) {
                // Short delay to allow state to settle then save
                setTimeout(() => {
                    handleQuickSave(street, houseNum, postalCode, city, lat, lon);
                }, 100);
            } else {
                error('Lo sentimos, esta dirección está fuera de nuestra zona de reparto 📍');
            }
        }
    };

    const handleQuickSave = async (
        street: string,
        house: string,
        pCode: string,
        city: string,
        lat?: number,
        lon?: number
    ) => {
        if (isSubmitting.current) return;

        // Capture phone from ref since it's most reliable
        const phoneVal = (phoneRef.current?.value || '').trim();
        const labelVal = (labelRef.current?.value || '').trim();

        if (!phoneVal) {
            error('Por favor, indica un teléfono de contacto antes de continuar');
            // Focus phone
            phoneRef.current?.focus();
            return;
        }

        const dataToSave = {
            ...newAddress,
            label: labelVal || 'Casa',
            street,
            house,
            postalCode: pCode,
            city,
            lat,
            lon,
            phone: `+34${phoneVal}`,
        };

        try {
            isSubmitting.current = true;
            if (editId && editAddress) {
                await editAddress(editId, dataToSave);
                success('¡Dirección actualizada con éxito! 📍');
            } else {
                await addAddress(dataToSave);
                success('¡Dirección añadida сon éxito! 🏠');
            }
            resetForm();
        } catch (err: any) {
            error(err.message || 'Error al guardar la dirección');
        } finally {
            isSubmitting.current = false;
        }
    };

    const performSearch = async (query: string, autoConfirm = false) => {
        if (query.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const data = await api.get(`/delivery-zones/search?q=${encodeURIComponent(query)}`);
            const results = data || [];
            setSuggestions(results);
            setShowSuggestions(results.length > 0);

            if (autoConfirm && results.length > 0) {
                // Check if the query has a number
                const hasNumber = /\d/.test(query);
                if (hasNumber) {
                    handleSelectSuggestion(results[0], query, true);
                }
            }
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setIsSearching(false);
        }
    };

    const formRef = useRef<HTMLDivElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    // Scroll form into view when opened
    useEffect(() => {
        if (showAddAddress && shouldScroll && formRef.current) {
            const headerOffset = window.innerWidth < 768 ? 140 : 100;
            const elementPosition = formRef.current.getBoundingClientRect().top;
            const offsetPosition =
                elementPosition + (window.scrollY || window.pageYOffset) - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
            setShouldScroll(false);
        }
    }, [showAddAddress, shouldScroll]);

    const handleStreetChange = (value: string) => {
        setSearchQuery(value);
        if (value !== newAddress.street) {
            wasSelectedViaSearchRef.current = false;
        }
        setNewAddress(p => ({ ...p, street: value }));
    };

    const startEditing = (addr: UserAddress) => {
        setEditId(addr.id);

        setNewAddress({
            label: addr.label,
            street: addr.street,
            house: addr.house || '',
            apartment: addr.apartment || '',
            city: addr.city,
            postalCode: addr.postalCode || '',
            phone: addr.phone || '',
            isDefault: addr.isDefault,
            lat: (addr as any).lat,
            lon: (addr as any).lon,
        });

        // Sync refs with edited values
        setTimeout(() => {
            if (labelRef.current) labelRef.current.value = addr.label;
            if (streetRef.current) streetRef.current.value = addr.street;
            if (houseRef.current) houseRef.current.value = addr.house || '';
            if (apartmentRef.current) apartmentRef.current.value = addr.apartment || '';
            if (phoneRef.current) phoneRef.current.value = (addr.phone || '').replace(/^\+34/, '');
        }, 0);

        ignoreNextSearchRef.current = true;
        setSearchQuery(addr.street);
        setShowAddAddress(true);
        setShouldScroll(true);
    };

    const handleAddClick = () => {
        setShowAddAddress(true);
        setShouldScroll(true);
    };

    const resetForm = () => {
        setNewAddress({
            label: '',
            street: '',
            house: '',
            apartment: '',
            city: 'Madrid',
            postalCode: '',
            phone: '',
            isDefault: false,
            lat: undefined,
            lon: undefined,
        });
        setSearchQuery('');
        setEditId(null);
        setShowAddAddress(false);

        // Scroll back to top of tab when form closes - use a small delay for layout settling
        setTimeout(() => {
            const headerOffset = window.innerWidth < 768 ? 140 : 100;
            const element = document.getElementById('profile-content');
            if (element) {
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition =
                    elementPosition + (window.scrollY || window.pageYOffset) - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth',
                });
            }
        }, 100);
    };

    const handleSaveAddress = async () => {
        if (isSubmitting.current) return;

        // Safari Sync Hack
        [labelRef, streetRef, houseRef, apartmentRef, phoneRef].forEach(ref => {
            if (ref.current) {
                ref.current.focus();
                ref.current.blur();
            }
        });

        const labelVal = (labelRef.current?.value || '').trim();
        const streetVal = (streetRef.current?.value || '').trim();
        const houseVal = (houseRef.current?.value || '').trim();
        const apartmentVal = (apartmentRef.current?.value || '').trim();
        const phoneVal = (phoneRef.current?.value || '').trim();

        if (!labelVal || !streetVal || !newAddress.postalCode || !phoneVal) {
            error('Por favor, rellena todos los campos obligatorios');
            return;
        }

        const finalPhone = phoneVal ? `+34${phoneVal}` : '';

        // SECURITY CHECK: If the address was manually edited but the coordinates
        // are still missing or point to the restaurant (fake location check)
        const isMarkerAtRestaurant =
            !newAddress.lat ||
            !newAddress.lon ||
            (Math.abs(newAddress.lat - 40.397042) < 0.0001 &&
                Math.abs(newAddress.lon - -3.672449) < 0.0001);

        if (streetVal && !wasSelectedViaSearchRef.current && isMarkerAtRestaurant) {
            error('Por favor, selecciona tu dirección de la lista para confirmar la ubicación 📍');
            return;
        }

        const dataToSave = {
            ...newAddress,
            label: labelVal,
            street: streetVal,
            house: houseVal,
            apartment: apartmentVal,
            phone: finalPhone,
        };

        try {
            isSubmitting.current = true;
            if (editId && editAddress) {
                await editAddress(editId, dataToSave);
                success('¡Dirección actualizada con éxito! 📍');
            } else {
                await addAddress(dataToSave);
                success('¡Dirección añadida con éxito! 🏠');
            }
            resetForm();
        } catch (err: any) {
            error(err.message || 'Error al guardar la dirección');
        } finally {
            isSubmitting.current = false;
        }
    };

    const confirmDelete = async () => {
        if (!addressToDelete) return;
        setIsDeleting(true);
        try {
            await removeAddress(addressToDelete);
            success('¡Dirección eliminada con éxito! 🗑️');
            setAddressToDelete(null);
        } catch (err: any) {
            error(err.message || 'Error al eliminar la dirección');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-lg md:text-xl font-black text-gray-900 m-0 tracking-tight">
                        Mis Direcciones
                    </h3>
                    <p className="text-gray-400 text-[11px] md:text-xs mt-0.5 m-0 font-medium">
                        Gestiona tus lugares de entrega frecuentes ({addresses.length}/5)
                    </p>
                </div>
                {addresses.length < 5 ? (
                    <button
                        onClick={handleAddClick}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl font-extrabold text-xs hover:bg-orange-700 transition-all active:scale-95 shrink-0 cursor-pointer border-none"
                    >
                        <Plus size={15} strokeWidth={2.5} /> Añadir
                    </button>
                ) : (
                    <span className="text-[11px] font-bold text-amber-600 shrink-0">
                        Límite 5/5
                    </span>
                )}
            </div>

            {/* Add/Edit Form - Flat Section */}
            {showAddAddress && (
                <div ref={formRef} className="pb-6 border-b border-gray-100 space-y-5 relative">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider m-0">
                            {editId ? 'Editar dirección' : 'Nueva dirección'}
                        </h3>
                        <button
                            onClick={resetForm}
                            className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer p-1"
                        >
                            <X size={18} strokeWidth={2} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                                Etiqueta (ej: Casa, Oficina)
                            </label>
                            <input
                                ref={labelRef}
                                defaultValue={newAddress.label}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-600/20 outline-none transition-all"
                                placeholder="Casa"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                                Teléfono de contacto
                            </label>
                            <div className="flex items-center bg-white border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-orange-600/20 focus-within:border-orange-600 transition-all shadow-sm overflow-hidden h-[46px]">
                                <div className="pl-4 pr-2 text-gray-400 font-bold text-sm select-none border-r border-gray-100 h-full flex items-center bg-gray-50">
                                    +34
                                </div>
                                <input
                                    ref={phoneRef}
                                    type="tel"
                                    defaultValue={newAddress.phone.replace(/^\+34/, '')}
                                    className="w-full bg-transparent border-none px-4 py-3 text-sm font-bold outline-none text-gray-900"
                                    placeholder="600 000 000"
                                    maxLength={9}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2 relative" ref={suggestionsRef}>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                                Calle / Avenida *
                            </label>
                            <div className="relative group">
                                <input
                                    ref={streetRef}
                                    value={searchQuery}
                                    onChange={e => handleStreetChange(e.target.value)}
                                    className={`w-full bg-white border border-gray-200 rounded-xl pl-11 pr-12 py-4 text-sm font-black text-gray-900 shadow-sm focus:ring-4 focus:ring-orange-600/10 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400 placeholder:font-bold ${newAddress.street && 'border-green-200 bg-green-50/5'}`}
                                    placeholder="Introduce tu calle y número..."
                                    autoComplete="off"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Search
                                        size={18}
                                        strokeWidth={2.5}
                                        className={`transition-colors ${newAddress.street ? 'text-green-500' : 'text-orange-500'}`}
                                    />
                                </div>
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2
                                            size={18}
                                            className="animate-spin text-orange-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {showSuggestions &&
                                (isSearching ||
                                    suggestions.length > 0 ||
                                    searchQuery.trim().length >= 3) && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-y-auto max-h-[320px] animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-gray-50 scrollbar-thin scrollbar-thumb-gray-200">
                                        {/* Sticky LOCALIZAR Button */}
                                        {searchQuery.trim().length >= 3 &&
                                            /\d/.test(searchQuery) && (
                                                <button
                                                    type="button"
                                                    disabled={isSearching}
                                                    onPointerDown={e => {
                                                        e.preventDefault();
                                                        performSearch(searchQuery.trim(), true);
                                                    }}
                                                    className="sticky top-0 z-10 w-full px-4 py-5 text-left bg-green-600 hover:bg-green-700 transition flex items-center gap-4 text-white shadow-lg overflow-hidden group/loc"
                                                >
                                                    <div className="absolute top-0 right-0 w-24 h-full bg-white/10 -skew-x-12 translate-x-12 group-hover/loc:translate-x-0 transition-transform duration-700" />
                                                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                                                        {isSearching ? (
                                                            <Loader2
                                                                size={20}
                                                                className="animate-spin text-white"
                                                            />
                                                        ) : (
                                                            <MapPin
                                                                size={20}
                                                                className="text-white fill-white/20"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-black uppercase tracking-widest">
                                                            {isSearching
                                                                ? 'Localizando...'
                                                                : 'Localizar & Confirmar'}
                                                        </span>
                                                        <span className="text-[10px] font-bold opacity-80 truncate mt-0.5">
                                                            {searchQuery}
                                                        </span>
                                                    </div>
                                                    {!isSearching && (
                                                        <ArrowRight
                                                            size={18}
                                                            className="text-white ml-auto shrink-0 group-hover/loc:translate-x-1 transition-transform"
                                                        />
                                                    )}
                                                </button>
                                            )}
                                        {suggestions.map((s, i) => {
                                            const queryNum =
                                                searchQuery.match(/\b(\d+[a-zA-Z]?)\s*$/)?.[1] ||
                                                searchQuery.match(/^(\d+[a-zA-Z]?)\s/)?.[1] ||
                                                '';
                                            const hasOwnHouse = !!s.address?.house_number;
                                            const displayHouse = hasOwnHouse
                                                ? s.address.house_number
                                                : queryNum;

                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onPointerDown={e => {
                                                        e.preventDefault();
                                                        handleSelectSuggestion(s, searchQuery);
                                                    }}
                                                    className="flex items-start gap-3 w-full p-4 text-left hover:bg-orange-50 transition-colors group"
                                                >
                                                    <MapPin
                                                        size={14}
                                                        strokeWidth={1.5}
                                                        className="mt-1 text-gray-300 group-hover:text-orange-500 transition-colors shrink-0"
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold text-gray-900 group-hover:text-orange-600 truncate">
                                                            {s.address?.road ||
                                                                s.display_name.split(',')[0]}
                                                            {displayHouse && `, ${displayHouse}`}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                                            {s.address?.city ||
                                                                s.address?.town ||
                                                                s.address?.village ||
                                                                s.address?.suburb ||
                                                                'Comunidad de Madrid'}
                                                            {s.address?.postcode &&
                                                                ` • ${s.address.postcode}`}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        {/* No results message */}
                                        {!isSearching &&
                                            suggestions.length === 0 &&
                                            searchQuery.trim().length >= 3 && (
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
                                                        Intenta añadir el número o revisa el nombre
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                                Número *
                            </label>
                            <input
                                ref={houseRef}
                                defaultValue={newAddress.house}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-600/20 outline-none transition-all"
                                placeholder="Ej: 20"
                            />
                            {!newAddress.house && newAddress.street && (
                                <p className="text-[9px] font-bold text-orange-500 mt-1 px-1 leading-none h-1">
                                    Escribe tu número manualmente
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                                Piso, Escalera, Puerta
                            </label>
                            <input
                                ref={apartmentRef}
                                defaultValue={newAddress.apartment}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-600/20 outline-none transition-all"
                                placeholder="Piso 3, Puerta A..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                                Ciudad
                            </label>
                            <input
                                value={newAddress.city}
                                readOnly
                                className="w-full bg-gray-100 border border-transparent rounded-xl px-4 py-3 text-sm font-bold text-gray-500 cursor-not-allowed outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                                Código Postal
                            </label>
                            <input
                                value={newAddress.postalCode}
                                readOnly
                                className="w-full bg-gray-100 border border-transparent rounded-xl px-4 py-3 text-sm font-bold text-gray-500 cursor-not-allowed outline-none"
                                placeholder="28001"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 relative z-10">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={newAddress.isDefault}
                                onChange={e =>
                                    setNewAddress(p => ({ ...p, isDefault: e.target.checked }))
                                }
                                className="w-5 h-5 rounded-lg border-2 border-gray-300 text-orange-600 focus:ring-orange-600 transition-all cursor-pointer"
                            />
                            <span className="text-sm font-black text-gray-600 group-hover:text-gray-900 transition-colors">
                                Establecer como predeterminada
                            </span>
                        </label>

                        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                            <button
                                onClick={resetForm}
                                className="flex-1 sm:flex-none h-[52px] flex items-center justify-center px-8 bg-gray-100 text-gray-500 rounded-xl font-black text-xs md:text-sm hover:bg-gray-200 hover:text-gray-900 transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveAddress}
                                className="flex-1 sm:flex-none h-[52px] flex items-center justify-center px-8 bg-orange-600 text-white rounded-xl font-black text-xs md:text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 active:scale-95 text-center leading-tight"
                            >
                                {editId ? 'Guardar Cambios' : 'Guardar Dirección'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Address List - Flat Rows */}
            <div className="divide-y divide-gray-100">
                {!addresses ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="py-4 animate-pulse flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/4 bg-gray-100 rounded" />
                                    <div className="h-3 w-1/2 bg-gray-50 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : addresses.length === 0 && !showAddAddress ? (
                    <div className="py-10 text-center">
                        <div className="text-3xl mb-3">🏠</div>
                        <h3 className="text-base font-black text-gray-900 mb-1">Sin direcciones</h3>
                        <p className="text-gray-400 text-xs max-w-xs mx-auto mb-5">
                            Añade una dirección para que tus pedidos lleguen volando.
                        </p>
                        <button
                            onClick={handleAddClick}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-xs hover:bg-orange-700 transition-all cursor-pointer border-none"
                        >
                            <Plus size={15} strokeWidth={2} /> Añadir ahora
                        </button>
                    </div>
                ) : (
                    addresses.map(addr => (
                        <div
                            key={addr.id}
                            className="group py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                        >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <MapPin
                                    size={18}
                                    strokeWidth={2}
                                    className={`mt-0.5 shrink-0 ${addr.isDefault ? 'text-orange-600' : 'text-gray-400'}`}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-2 mb-0.5">
                                        <h4 className="text-sm font-black text-gray-900 m-0">
                                            {addr.label}
                                        </h4>
                                        {addr.isDefault && (
                                            <span className="text-[10px] uppercase font-extrabold text-emerald-600 tracking-wide">
                                                • Principal
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-gray-700 m-0 leading-snug">
                                        {addr.street}
                                        {addr.house && `, ${addr.house}`}
                                        {addr.apartment && `, ${addr.apartment}`}
                                    </p>
                                    <div className="flex items-center flex-wrap gap-2 mt-1">
                                        <p className="text-[11px] font-medium text-gray-400 m-0">
                                            {addr.postalCode} • {addr.city} • {addr.phone}
                                        </p>

                                        {/* Zone Info Highlights */}
                                        {(() => {
                                            const zone = detectZone(
                                                (addr as any).lat,
                                                (addr as any).lon,
                                                deliveryZones,
                                                addr.postalCode
                                            );
                                            if (!zone) return null;
                                            return (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-gray-600">
                                                    <span>•</span>
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ backgroundColor: zone.color }}
                                                    />
                                                    <span>
                                                        {zone.name} ({zone.cost.toFixed(2)}€)
                                                    </span>
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                {!addr.isDefault && (
                                    <button
                                        onClick={() => setDefaultAddress(addr.id)}
                                        className="h-8 px-2.5 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border-none cursor-pointer"
                                        title="Establecer como predeterminada"
                                    >
                                        <Star size={13} strokeWidth={2} />
                                        <span className="hidden sm:inline">Principal</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => startEditing(addr)}
                                    className="h-8 w-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition-colors border-none cursor-pointer"
                                    title="Editar"
                                >
                                    <Pencil size={14} strokeWidth={2} />
                                </button>
                                <button
                                    onClick={() => setAddressToDelete(addr.id)}
                                    className="h-8 w-8 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors border-none cursor-pointer"
                                    title="Eliminar"
                                >
                                    <Trash2 size={14} strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <DeleteConfirmationModal
                isOpen={!!addressToDelete}
                onClose={() => setAddressToDelete(null)}
                onConfirm={confirmDelete}
                title="¿Eliminar dirección?"
                description="¿Estás seguro de que deseas eliminar esta dirección?"
                isLoading={isDeleting}
                itemType="dirección"
                itemName={addresses.find(a => a.id === addressToDelete)?.label}
            />
        </div>
    );
}
