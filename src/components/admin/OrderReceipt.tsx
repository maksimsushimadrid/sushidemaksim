import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { Order } from '../../types';
import QRCode from 'react-qr-code';
import { SITE_URL } from '../../constants/config';

interface OrderReceiptProps {
    order: Order | null;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order }) => {
    // 1. Guard against null order
    if (!order) return null;

    // Use portal to render outside the main #root hierarchy
    return createPortal(<ReceiptContent order={order} />, document.body);
};

const ReceiptContent: React.FC<{ order: Order }> = ({ order }) => {
    // Fetch restaurant settings for real address/phone
    const { data: settings } = useQuery({
        queryKey: ['admin-settings-brief'],
        queryFn: () => api.get('/admin/settings'),
        staleTime: 600000, // Cache for 10 mins
    });

    try {
        const orderId = String(order.id || 'N/A');
        const displayId =
            orderId.length > 8 ? orderId.slice(0, 8).toUpperCase() : orderId.toUpperCase();
        const rawDate = order.createdAt || '';
        let displayDate = rawDate;

        try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
                displayDate = d.toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }
        } catch (e) {
            displayDate = rawDate;
        }

        // --- CALCULATIONS ---
        const items = Array.isArray(order.items) ? order.items : [];
        const deliveryFee = Number(order.deliveryFee) || 0;
        const tipAmount = Number(order.tipAmount) || 0;
        const totalValue = Number(order.total) || 0;

        // Sum of all items (original menu price * quantity) - excluding delivery fee item
        const itemsSubtotal = items
            .filter(item => {
                const name = (item.name || '').toLowerCase();
                return (
                    !name.includes('gastos') &&
                    !name.includes('envío') &&
                    !name.includes('propina') &&
                    item.menuItemId !== '-1' &&
                    item.menuItemId !== '0' &&
                    !!item.menuItemId
                );
            })
            .reduce((sum, item) => {
                const unitPrice = Number(item?.price || item?.priceAtTime) || 0;
                const qty = Number(item?.quantity) || 1;
                return sum + unitPrice * qty;
            }, 0);

        const globalDiscount = itemsSubtotal - (totalValue - deliveryFee - tipAmount);

        // Taxes calculation (simplified 10% for food)
        const ivaValue = totalValue * 0.090909; // 10% included in price: Total - (Total / 1.1)
        const baseImponible = totalValue - ivaValue;

        const clientName = order.users?.name || 'Invitado';
        const phone = order.phoneNumber || (order as any).phone || '—';

        // Infer delivery type from address since it might not be explicitly provided
        const addr = order.deliveryAddress || '';
        const isPickup = addr === 'RECOGIDA';
        const isTable = addr.startsWith('MESA');
        const isDelivery = !isPickup && !isTable && addr.length > 0;

        // For tables, use the full addr string (e.g. "MESA 5")
        const deliveryTypeLabel = isDelivery ? 'DOMICILIO' : isPickup ? 'RECOGIDA' : addr || 'MESA';

        // Restaurant Info from Settings or Defaults
        const restAddr1 = settings?.contactAddressLine1 || 'Calle Barrilero, 20';
        const restAddr2 = settings?.contactAddressLine2 || '28007 Madrid';
        const restPhone = settings?.contactPhone || '631 920 312';

        return (
            <div className="receipt-container fixed top-0 left-0 right-0 z-[999999] bg-white text-black px-4 py-8 font-mono text-[12px] leading-relaxed w-[80mm] mx-auto print:block hidden">
                <style>{`
                    @media print {
                        @page {
                            margin: 0;
                            size: 80mm auto;
                        }
                        html, body {
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            height: auto !important;
                        }
                        #root, .main-layout, footer, header {
                            display: none !important;
                        }
                        .receipt-container {
                            position: static !important;
                            display: block !important;
                            width: 100% !important;
                            padding: 4mm !important;
                            visibility: visible !important;
                            margin: 0 !important;
                        }
                    }
                `}</style>

                <div className="text-center mb-6">
                    <h1 className="text-lg font-black uppercase mb-0">Sushi de Maksim</h1>
                    <p className="text-[10px] font-bold mb-1">NIF: B02761906</p>
                    <p className="text-[11px] font-bold">{restAddr1}</p>
                    <p className="text-[11px] font-bold">{restAddr2}</p>
                    <p className="text-[10px]">Tel: {restPhone}</p>
                    <div className="border-b border-dashed border-black my-4" />
                    <h2 className="font-bold text-[12px]">FACTURA SIMPLIFICADA</h2>
                    <p className="mt-1">Nº: {displayId}</p>
                    <p>Fecha Pedido: {displayDate}</p>
                    <div className="mt-2 pt-2 border-t border-black/10">
                        <p className="font-black text-[13px]">{deliveryTypeLabel}</p>
                        {order.estimatedDeliveryTime && (
                            <p className="font-bold text-[11px] mt-1">
                                {order.estimatedDeliveryTime.includes('min')
                                    ? `Estimado: ${order.estimatedDeliveryTime}`
                                    : `ENTREGA PROGRAMADA: ${order.estimatedDeliveryTime}`}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between font-bold border-b border-black pb-2 mb-2">
                        <span className="w-10">Cant</span>
                        <span className="flex-1 px-1">Producto</span>
                        <span className="w-20 text-right">Total</span>
                    </div>
                    {items.map((item, idx) => {
                        const itemQty = Number(item?.quantity) || 1;
                        const itemName = item?.name || 'Producto';
                        const originalUnitPrice = Number(item?.price || item?.priceAtTime) || 0;
                        const paidUnitPrice = item?.isGift
                            ? 0
                            : Number(item?.priceAtTime || item?.price) || 0;
                        const lineTotal = paidUnitPrice * itemQty;
                        const hasDiscount = originalUnitPrice > paidUnitPrice;

                        return (
                            <div
                                key={idx}
                                className="flex justify-between py-1 border-b border-dashed border-black/10"
                            >
                                <span className="w-10">{itemQty}x</span>
                                <div className="flex-1 px-1 flex flex-col">
                                    <span className="leading-[1.2]">{itemName}</span>
                                    {hasDiscount && (
                                        <span className="text-[9px] opacity-60">
                                            Original: {originalUnitPrice.toFixed(2)}€
                                        </span>
                                    )}
                                </div>
                                <span className="w-20 text-right">
                                    {item?.isGift ? 'GRATIS' : `${lineTotal.toFixed(2)}€`}
                                </span>
                            </div>
                        );
                    })}
                    {items.length === 0 && (
                        <p className="text-center py-4 text-[10px]">Sin productos</p>
                    )}
                </div>

                <div className="border-t-2 border-black pt-2 mb-6 space-y-1">
                    <div className="flex justify-between text-[11px]">
                        <span>Subtotal Productos</span>
                        <span>{itemsSubtotal.toFixed(2)}€</span>
                    </div>
                    {deliveryFee > 0 && (
                        <div className="flex justify-between text-[11px]">
                            <span>Envío / Delivery</span>
                            <span>{deliveryFee.toFixed(2)}€</span>
                        </div>
                    )}
                    {tipAmount > 0 && (
                        <div className="flex justify-between text-[11px]">
                            <span>Propina equipo</span>
                            <span>{tipAmount.toFixed(2)}€</span>
                        </div>
                    )}
                    {globalDiscount > 0.05 && (
                        <div className="flex justify-between text-[11px] font-bold">
                            <span>DESCUENTO</span>
                            <span>-{globalDiscount.toFixed(2)}€</span>
                        </div>
                    )}

                    <div className="flex justify-between font-black text-[14px] border-t border-black pt-1 mt-1">
                        <span>TOTAL</span>
                        <span>{totalValue.toFixed(2)}€</span>
                    </div>
                </div>

                <div className="text-[12px] mb-6 border-b border-dashed border-black pb-4">
                    <div className="flex justify-between">
                        <span>Base Imponible (10%)</span>
                        <span>{baseImponible.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                        <span>IVA (10%)</span>
                        <span>{ivaValue.toFixed(2)}€</span>
                    </div>
                </div>

                <div className="text-center">
                    <p className="font-bold mb-4 text-[12px]">¡Gracias por su visita!</p>

                    <div className="mt-6 flex flex-col items-start text-[11px] space-y-2 text-left bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0 border border-gray-100 print:border-none">
                        <p>
                            <strong>Cliente:</strong> {clientName}
                        </p>
                        <p>
                            <strong>Tel:</strong> {phone}
                        </p>
                        <p>
                            <strong>Tipo:</strong> {deliveryTypeLabel}
                        </p>
                        {order.deliveryAddress &&
                            !isPickup &&
                            !isTable &&
                            order.deliveryAddress !== 'RECOGIDA' && (
                                <p className="mt-2 border-t border-dashed border-black/20 pt-2 w-full text-[12px]">
                                    <strong>Dirección de Entrega:</strong>
                                    <span className="block mt-1 font-bold">
                                        {order.deliveryAddress}
                                    </span>
                                </p>
                            )}
                        {order.notes && (
                            <p className="mt-2 text-[12px] text-black">
                                <strong>Notas:</strong> {order.notes}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center mt-8 mb-4 border-t border-dashed border-black/10 pt-6">
                    <div className="bg-white p-2 border border-black/5 rounded-md mb-2">
                        <QRCode
                            value={`${SITE_URL}/menu`}
                            size={110}
                            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                        Ver Carta Online
                    </p>
                    <p className="text-[8px] opacity-60">www.sushidemaksim.com</p>
                </div>
            </div>
        );
    } catch (error) {
        return (
            <div className="fixed top-0 left-0 bg-white p-10 z-[999999] text-black">
                <p>Error crítico en ticket: {String(error)}</p>
            </div>
        );
    }
};
