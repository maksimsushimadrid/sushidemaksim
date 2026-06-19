import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    MapContainer,
    TileLayer,
    Polygon,
    FeatureGroup,
    Marker,
    Popup,
    Circle,
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import {
    Trash2,
    Settings,
    MapPin,
    RefreshCw,
    X,
    PlusCircle,
    Circle as CircleIcon,
    Map as MapIcon,
} from 'lucide-react';

// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface DeliveryZone {
    id: string;
    name: string;
    cost: number;
    minOrder: number;
    color: string;
    opacity: number;
    coordinates: [number, number][];
    isActive: boolean;
    type: 'polygon' | 'radius';
    minRadius: number;
    maxRadius: number;
    freeThreshold?: number | null;
}

const RESTAURANT_LOCATION: [number, number] = [40.397042, -3.672449];

interface Props {
    language?: 'ru' | 'es';
}

const ZONES_TRANSLATIONS = {
    ru: {
        title: 'Зоны доставки',
        subtitle: 'Нарисуйте полигоны для определения зон.',
        newRadiusZone: 'Новая зона (радиус)',
        refresh: 'Обновить',
        loading: 'Загрузка карты зон...',
        savedCount: 'сохраненных зон',
        noZones:
            'Зоны не определены. Используйте инструмент рисования (полигон), чтобы создать новую.',
        shipping: 'Доставка',
        min: 'Мин',
        free: 'Бесплатно',
        distance: 'Дистанция',
        deleteConfirm: 'Удалить эту зону?',
        deleteSuccess: 'Зона удалена',
        saveSuccess: 'Зона успешно сохранена',
        saveError: 'Ошибка при сохранении зоны',
        modal: {
            title: 'Настройка зоны',
            type: 'Тип зоны',
            polygon: 'Полигон (вручную)',
            radius: 'Радиус (круг)',
            name: 'Название зоны',
            minRadius: 'Мин. радиус (км)',
            maxRadius: 'Макс. радиус (км)',
            cost: 'Цена доставки (€)',
            minOrder: 'Мин. заказ (€)',
            freeFrom: 'Бесплатно от (€)',
            color: 'Цвет',
            opacity: 'Прозрачность (0.1 - 1.0)',
            cancel: 'Отмена',
            save: 'Сохранить зону',
            saving: 'Сохранение...',
            desc: 'Вы собираетесь удалить зону "{name}". Это действие нельзя отменить.',
        },
    },
    es: {
        title: 'Zonas de Entrega',
        subtitle: 'Dibuja polígonos para definir las áreas.',
        newRadiusZone: 'Nueva Zona Radio',
        refresh: 'Refrescar',
        loading: 'Cargando mapa de zonas...',
        savedCount: 'Zonas Guardadas',
        noZones: 'No hay zonas definidas. Usa la herramienta de dibujo (polígono) para crear una.',
        shipping: 'Envío',
        min: 'Mín',
        free: 'Gratis',
        distance: 'Distancia',
        deleteConfirm: '¿Eliminar esta zona?',
        deleteSuccess: 'Zona eliminada',
        saveSuccess: 'Zona guardada correctamente',
        saveError: 'Error al guardar la zona',
        modal: {
            title: 'Configurar Zona',
            type: 'Tipo de Zona',
            polygon: 'Polígono (Personalizado)',
            radius: 'Radio (Círculo)',
            name: 'Nombre de la Zona',
            minRadius: 'Radio Mín (км)',
            maxRadius: 'Radio Máx (км)',
            cost: 'Costo Envío (€)',
            minOrder: 'Pedido Mín. (€)',
            freeFrom: 'Envío Gratis desde (€)',
            color: 'Color',
            opacity: 'Opacidad (0.1 - 1.0)',
            cancel: 'Cancelar',
            save: 'Guardar Zona',
            saving: 'Guardando...',
            desc: 'Estás a punto de eliminar la zona "{name}". Esta acción no se puede deshacer.',
        },
    },
} as const;

export default function AdminDeliveryZones({ language = 'es' }: Props) {
    const t = ZONES_TRANSLATIONS[language] || ZONES_TRANSLATIONS.es;
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();
    const [editingZone, setEditingZone] = useState<Partial<DeliveryZone> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [zoneToDelete, setZoneToDelete] = useState<DeliveryZone | null>(null);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
            (window as any).lenis?.stop();
        } else {
            document.body.style.overflow = 'unset';
            (window as any).lenis?.start();
        }
        return () => {
            document.body.style.overflow = 'unset';
            (window as any).lenis?.start();
        };
    }, [isModalOpen]);

    const {
        data: zones = [],
        isLoading,
        refetch,
    } = useQuery<DeliveryZone[]>({
        queryKey: ['delivery-zones'],
        queryFn: async () => {
            const res = await api.get('/admin/delivery-zones');
            return res.zones;
        },
    });

    const upsertMutation = useMutation({
        mutationFn: (data: Partial<DeliveryZone>) => {
            return data.id
                ? api.put(`/admin/delivery-zones/${data.id}`, data)
                : api.post('/admin/delivery-zones', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
            success(t.saveSuccess);
            setIsModalOpen(false);
            setEditingZone(null);
        },
        onError: (err: any) => {
            toastError(err.message || t.saveError);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/delivery-zones/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
            success(t.deleteSuccess);
            setZoneToDelete(null);
        },
    });

    const handleCreated = (e: any) => {
        const { layerType, layer } = e;
        if (layerType === 'polygon') {
            const latlngs = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
            setEditingZone({
                name: '',
                cost: 0,
                minOrder: 0,
                color: '#EF4444',
                opacity: 0.3,
                coordinates: latlngs,
                isActive: true,
                type: 'polygon',
                minRadius: 0,
                maxRadius: 0,
            });
            setIsModalOpen(true);
            // Remove the temporary layer from the map so we can render it from state
            layer.remove();
        }
    };

    const addNewRadiusZone = () => {
        setEditingZone({
            name: '',
            cost: 0,
            minOrder: 0,
            color: '#3B82F6',
            opacity: 0.1,
            coordinates: [],
            isActive: true,
            type: 'radius',
            minRadius: 0,
            maxRadius: 1,
        });
        setIsModalOpen(true);
    };

    const handleEdited = (e: any) => {
        const { layers } = e;
        layers.eachLayer((layer: any) => {
            const id = layer.options.id;
            const latlngs = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
            console.log('📍 Editing zone ID:', id, 'New latlngs:', latlngs);
            const zone = zones.find(z => z.id === id);
            if (zone) {
                upsertMutation.mutate({ ...zone, coordinates: latlngs });
            } else {
                console.warn('⚠️ Zone not found for ID:', id);
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <RefreshCw size={32} className="animate-spin mb-4" />
                <p>{t.loading}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="font-bold text-gray-900">{t.title}</h3>
                    <p className="text-sm text-gray-500">{t.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={addNewRadiusZone}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold text-sm shadow-sm"
                    >
                        <PlusCircle size={18} />
                        {t.newRadiusZone}
                    </button>
                    <button
                        onClick={() => refetch()}
                        className="p-2 text-gray-400 hover:text-gray-600 transition border border-gray-100 rounded-lg bg-gray-50"
                        title={t.refresh}
                    >
                        <RefreshCw size={20} />
                    </button>
                    <div className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                        {zones.length} {t.savedCount}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Area */}
                <div className="lg:col-span-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[350px] md:h-[600px]">
                    <MapContainer
                        center={RESTAURANT_LOCATION}
                        zoom={14}
                        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                        attributionControl={false}
                    >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

                        <Marker position={RESTAURANT_LOCATION}>
                            <Popup>
                                <div className="text-center font-bold">Sushi de Maksim</div>
                                <div className="text-xs">C. de Barrilero, 20</div>
                            </Popup>
                        </Marker>

                        <FeatureGroup>
                            <EditControl
                                position="topright"
                                onCreated={handleCreated}
                                onEdited={handleEdited}
                                draw={{
                                    rectangle: false,
                                    circle: false,
                                    circlemarker: false,
                                    marker: false,
                                    polyline: false,
                                }}
                            />
                            {zones.map(zone => {
                                if (zone.type === 'radius') {
                                    return (
                                        <Circle
                                            key={zone.id}
                                            center={RESTAURANT_LOCATION}
                                            radius={zone.maxRadius * 1000}
                                            pathOptions={{
                                                color: zone.color,
                                                fillColor: zone.color,
                                                fillOpacity: zone.opacity,
                                                weight: 1,
                                                dashArray: '5, 10',
                                            }}
                                            eventHandlers={{
                                                click: () => {
                                                    setEditingZone(zone);
                                                    setIsModalOpen(true);
                                                },
                                            }}
                                        >
                                            <Popup>
                                                <div className="font-bold">{zone.name}</div>
                                                <div className="text-xs">
                                                    {t.distance}: {zone.minRadius}-{zone.maxRadius}{' '}
                                                    км
                                                </div>
                                                <div className="text-xs">
                                                    {t.shipping}: {zone.cost}€
                                                </div>
                                            </Popup>
                                        </Circle>
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
                                            pathOptions={{
                                                color: zone.color,
                                                fillColor: zone.color,
                                                fillOpacity: zone.opacity,
                                                // @ts-expect-error - store id for leaflet-draw edit events
                                                id: zone.id,
                                            }}
                                            eventHandlers={{
                                                click: () => {
                                                    setEditingZone(zone);
                                                    setIsModalOpen(true);
                                                },
                                            }}
                                        >
                                            <Popup>
                                                <div className="font-bold">{zone.name}</div>
                                                <div className="text-xs">
                                                    {t.shipping}: {zone.cost}€
                                                </div>
                                                <div className="text-xs">
                                                    {t.min}: {zone.minOrder}€
                                                </div>
                                            </Popup>
                                        </Polygon>
                                    );
                                }
                                return null;
                            })}
                        </FeatureGroup>
                    </MapContainer>
                </div>

                {/* Sidebar List */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {zones.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <MapPin size={32} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">{t.noZones}</p>
                        </div>
                    ) : (
                        zones.map(zone => (
                            <div
                                key={zone.id}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 group"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Color Indicator & Icon */}
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-black/5"
                                        style={{ backgroundColor: zone.color }}
                                    >
                                        {zone.type === 'radius' ? (
                                            <CircleIcon size={14} className="text-white" />
                                        ) : (
                                            <MapIcon size={14} className="text-white" />
                                        )}
                                    </div>

                                    {/* Name and Basic Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900 truncate text-sm">
                                                {zone.name}
                                            </h4>
                                            {zone.type === 'radius' && (
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    ({zone.minRadius}–{zone.maxRadius} км)
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                                            <span>
                                                {t.shipping}:{' '}
                                                <b className="text-gray-800">{zone.cost}€</b>
                                            </span>
                                            <span className="text-gray-300">|</span>
                                            <span>
                                                {t.min}:{' '}
                                                <b className="text-gray-800">{zone.minOrder}€</b>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingZone(zone);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Settings size={14} />
                                        </button>
                                        <button
                                            onClick={() => setZoneToDelete(zone)}
                                            className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal de Configuración de Zona */}
            {isModalOpen &&
                editingZone &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] bg-gray-900/60 backdrop-blur-sm overflow-y-auto overscroll-contain py-10 px-4 flex justify-center items-center"
                        onClick={e => {
                            if (e.target === e.currentTarget) setIsModalOpen(false);
                        }}
                    >
                        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                                <h2 className="text-xl font-bold text-gray-900">{t.modal.title}</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">
                                            {t.modal.type}
                                        </label>
                                        <select
                                            value={editingZone.type || 'polygon'}
                                            onChange={e =>
                                                setEditingZone({
                                                    ...editingZone,
                                                    type: e.target.value as any,
                                                })
                                            }
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition"
                                        >
                                            <option value="polygon">{t.modal.polygon}</option>
                                            <option value="radius">{t.modal.radius}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">
                                            {t.modal.name}
                                        </label>
                                        <input
                                            type="text"
                                            value={editingZone.name || ''}
                                            onChange={e =>
                                                setEditingZone({
                                                    ...editingZone,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="Ej: Retiro Norte"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition"
                                        />
                                    </div>
                                </div>

                                {editingZone.type === 'radius' && (
                                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">
                                                {t.modal.minRadius}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={editingZone.minRadius || 0}
                                                onChange={e =>
                                                    setEditingZone({
                                                        ...editingZone,
                                                        minRadius: parseFloat(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full px-4 py-2 bg-blue-50/50 border border-blue-100 rounded-lg focus:outline-none focus:border-blue-400 transition"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">
                                                {t.modal.maxRadius}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={editingZone.maxRadius || 0}
                                                onChange={e =>
                                                    setEditingZone({
                                                        ...editingZone,
                                                        maxRadius: parseFloat(e.target.value) || 0,
                                                    })
                                                }
                                                className="w-full px-4 py-2 bg-blue-50/50 border border-blue-100 rounded-lg focus:outline-none focus:border-blue-400 transition"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">
                                            {t.modal.cost}
                                        </label>
                                        <input
                                            type="number"
                                            value={editingZone.cost || 0}
                                            onChange={e =>
                                                setEditingZone({
                                                    ...editingZone,
                                                    cost: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">
                                            {t.modal.minOrder}
                                        </label>
                                        <input
                                            type="number"
                                            value={editingZone.minOrder || 0}
                                            onChange={e =>
                                                setEditingZone({
                                                    ...editingZone,
                                                    minOrder: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">
                                            {t.modal.color}
                                        </label>
                                        <input
                                            type="color"
                                            value={editingZone.color || '#EF4444'}
                                            onChange={e =>
                                                setEditingZone({
                                                    ...editingZone,
                                                    color: e.target.value,
                                                })
                                            }
                                            className="w-full h-10 p-1 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">
                                            {t.modal.opacity}
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={editingZone.opacity || 0.3}
                                            onChange={e =>
                                                setEditingZone({
                                                    ...editingZone,
                                                    opacity: parseFloat(e.target.value),
                                                })
                                            }
                                            className="w-full mt-2"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 flex justify-end gap-3 shrink-0">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition"
                                >
                                    {t.modal.cancel}
                                </button>
                                <button
                                    onClick={() => upsertMutation.mutate(editingZone)}
                                    disabled={upsertMutation.isPending || !editingZone.name}
                                    className="px-6 py-2 text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition disabled:bg-gray-300"
                                >
                                    {upsertMutation.isPending ? t.modal.saving : t.modal.save}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* Modal de Confirmación de Eliminación */}
            <DeleteConfirmationModal
                isOpen={!!zoneToDelete}
                onClose={() => setZoneToDelete(null)}
                onConfirm={() => {
                    if (zoneToDelete) {
                        deleteMutation.mutate(zoneToDelete.id);
                    }
                }}
                title={t.deleteConfirm}
                description={t.modal.desc?.replace('{name}', zoneToDelete?.name || '') || ''}
                isLoading={deleteMutation.isPending}
                language={language}
            />
        </div>
    );
}
