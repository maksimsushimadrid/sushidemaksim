import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Clock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomTimePickerProps {
    value: string;
    onChange: (time: string) => void;
    slots: string[];
    disabled?: boolean;
    placeholder?: string;
}

export default function CustomTimePicker({
    value,
    onChange,
    slots,
    disabled = false,
    placeholder = 'Hora',
}: CustomTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to selected slot when opened (only if something is already selected)
    useEffect(() => {
        if (isOpen && listRef.current) {
            if (value) {
                // Small delay to let the dropdown render
                requestAnimationFrame(() => {
                    const selectedEl = listRef.current?.querySelector('[data-selected="true"]');
                    if (selectedEl) {
                        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'instant' });
                    }
                });
            } else {
                // No value selected — scroll to top so user sees all options
                listRef.current.scrollTop = 0;
            }
        }
    }, [isOpen, value]);

    // Safe lock: prevent body scroll removed as it breaks sticky elements
    // We will use a transparent backdrop instead

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`relative ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <Clock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors"
                    size={18}
                />
                <div
                    className={`w-full pl-11 pr-10 h-[44px] bg-gray-50/50 border-2 border-transparent rounded-2xl text-[14px] font-bold flex items-center text-gray-900 transition-all select-none shadow-sm ${
                        isOpen ? 'ring-4 ring-orange-600/5 border-orange-600' : ''
                    } ${disabled ? 'bg-gray-100 text-gray-400' : ''}`}
                >
                    {value ? (
                        value
                    ) : (
                        <span className="text-gray-400 font-medium text-[14px]">{placeholder}</span>
                    )}
                </div>
                <ChevronDown
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                    size={16}
                />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Non-destructive backdrop to catch scroll/touch events while menu is open */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-modal"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 5, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-0 top-full mt-2 z-popover w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                    Hora
                                </div>
                            </div>

                            {/* Time slots list */}
                            <div
                                ref={listRef}
                                className="max-h-[230px] overflow-y-auto overscroll-contain py-1 touch-pan-y"
                                style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#e5e7eb transparent',
                                    WebkitOverflowScrolling: 'touch',
                                }}
                                onWheel={e => e.stopPropagation()}
                                onTouchMove={e => e.stopPropagation()}
                            >
                                {slots.map(slot => {
                                    const isSelected = value === slot;
                                    return (
                                        <button
                                            key={slot}
                                            type="button"
                                            data-selected={isSelected}
                                            onClick={() => {
                                                onChange(slot);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full px-4 py-3 flex items-center justify-between text-left border-none cursor-pointer transition-all duration-150
                                            ${
                                                isSelected
                                                    ? 'bg-orange-50 text-orange-600'
                                                    : 'bg-transparent text-gray-700 hover:bg-gray-50'
                                            }
                                        `}
                                        >
                                            <span
                                                className={`text-[15px] ${isSelected ? 'font-black' : 'font-bold'}`}
                                            >
                                                {slot}
                                            </span>
                                            {isSelected && (
                                                <Check
                                                    size={16}
                                                    strokeWidth={3}
                                                    className="text-orange-600"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
