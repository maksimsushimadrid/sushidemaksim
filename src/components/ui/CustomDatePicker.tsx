import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    min?: string;
    disabledDays?: number[]; // [0, 1, 2, ...]
    disabledDates?: string[]; // ['2023-01-01', ...]
    allowedDates?: string[];
    placeholder?: string;
}

const MONTHS = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

const DAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

export default function CustomDatePicker({
    value,
    onChange,
    min,
    disabledDays,
    disabledDates,
    allowedDates,
    placeholder,
}: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // View state for the calendar (current month/year being looked at)
    const [viewDate, setViewDate] = useState(() => {
        return value ? new Date(value) : new Date();
    });

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

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const formatDateForDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}.${m}.${y}`;
    };

    const generateDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        // Month starts at...
        const firstDayOfMonth = new Date(year, month, 1);
        // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
        // We want: 0=Mon, ..., 6=Sun
        let startDay = firstDayOfMonth.getDay() - 1;
        if (startDay === -1) startDay = 6; // Sunday becomes 6

        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Padding for previous month
        for (let i = 0; i < startDay; i++) {
            days.push({ day: null, type: 'padding' });
        }

        // Days of current month
        for (let d = 1; d <= lastDayOfMonth; d++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const dateObj = new Date(year, month, d);
            const dayOfWeek = dateObj.getDay();

            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isSelected = value === dateStr;
            const isMin = min ? dateStr < min : false;
            const isDayDisabled =
                disabledDays?.includes(dayOfWeek) && !allowedDates?.includes(dateStr);
            const isSpecificDateDisabled = disabledDates?.includes(dateStr);

            days.push({
                day: d,
                dateStr,
                isToday,
                isSelected,
                isDisabled: isMin || isDayDisabled || isSpecificDateDisabled,
            });
        }

        return days;
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="relative cursor-pointer">
                <CalendarIcon
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-orange-500 transition-colors"
                    size={18}
                />
                <div className="w-full pl-11 pr-4 h-[44px] bg-gray-50/50 border-2 border-transparent rounded-2xl text-[14px] font-bold flex items-center text-gray-900 focus-within:ring-4 focus-within:ring-orange-600/5 focus-within:border-orange-600 transition-all select-none shadow-sm">
                    {value ? (
                        formatDateForDisplay(value)
                    ) : (
                        <span className="text-gray-400 font-medium text-[14px]">
                            {placeholder || 'dd.mm.aaaa'}
                        </span>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 top-full mt-2 z-[1100] w-[280px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-4"
                    >
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                            >
                                <ChevronLeft size={18} className="text-gray-600" />
                            </button>
                            <div className="text-[12px] font-black uppercase text-gray-900 tracking-tight">
                                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </div>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <ChevronRight size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 mb-2">
                            {DAYS_SHORT.map(d => (
                                <div
                                    key={d}
                                    className="text-[10px] font-black text-gray-400 text-center uppercase tracking-widest"
                                >
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {generateDays().map((d, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={d.isDisabled}
                                    onClick={() => {
                                        if (d.dateStr) {
                                            onChange(d.dateStr);
                                            setIsOpen(false);
                                        }
                                    }}
                                    className={`h-9 w-full flex items-center justify-center rounded-lg text-xs font-bold transition-all border-none cursor-pointer
                                        ${d.day === null ? 'pointer-events-none' : ''}
                                        ${d.isSelected ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/40' : d.isToday ? 'text-orange-600 ring-2 ring-orange-100 font-black' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'}
                                        ${d.isDisabled ? 'opacity-20 cursor-not-allowed grayscale' : ''}
                                    `}
                                >
                                    {d.day}
                                </button>
                            ))}
                        </div>

                        {/* Shortcuts */}
                        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(new Date().toISOString().split('T')[0]);
                                    setIsOpen(false);
                                }}
                                className="text-[10px] font-black text-orange-600 uppercase tracking-widest border-none bg-transparent cursor-pointer hover:underline"
                            >
                                Hoy
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange('');
                                    setIsOpen(false);
                                }}
                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-none bg-transparent cursor-pointer hover:underline"
                            >
                                Limpiar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
