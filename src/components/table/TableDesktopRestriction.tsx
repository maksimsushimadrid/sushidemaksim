import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { useTableI18n } from '../../utils/tableI18n';

export const TableDesktopRestriction: React.FC = () => {
    const { t } = useTableI18n();

    return (
        <div className="fixed inset-0 z-modal bg-black text-white flex flex-col items-center justify-center p-8 text-center overflow-hidden">
            {/* Background Transitions matching screenshot */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Center-bottom warm glow */}
                <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[120vw] h-[80vw] bg-orange-950/20 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[50vw] bg-orange-900/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="relative z-10 flex flex-col items-center max-w-sm"
            >
                {/* Smartphone Icon */}
                <div className="relative mb-8">
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Smartphone size={110} strokeWidth={1} className="text-gray-600" />
                    </motion.div>
                </div>

                <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter leading-[0.8] mb-8 flex flex-col items-center">
                    <span className="text-white uppercase">{t('hey')}</span>
                    <span className="text-orange-600 uppercase">{t('mobile_only')}</span>
                </h1>

                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 mb-14 max-w-[280px] leading-relaxed">
                    {t('desktop_restriction')}
                </p>

                {/* QR Code with Glow */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-orange-600/20 blur-[40px] rounded-full scale-150 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-white p-5 rounded-[2.5rem] shadow-2xl">
                        <svg
                            width="160"
                            height="160"
                            viewBox="0 0 100 100"
                            className="text-black fill-current"
                        >
                            <rect width="100" height="100" fill="white" />
                            <path d="M10 10h20v20h-20zM10 40h10v10h-10zM10 60h20v20h-20zM40 10h10v10h-10zM60 10h20v20h-20zM40 40h20v20h-20zM70 40h10v10h-10zM40 70h10v10h-10zM60 70h20v20h-20z" />
                            <path d="M15 15h10v10h-10zM65 15h10v10h-10zM15 65h10v10h-10z" />
                            <rect x="45" y="45" width="10" height="10" />
                        </svg>
                    </div>
                </div>

                <p className="mt-12 text-[10px] font-black uppercase tracking-[0.5em] text-gray-700">
                    {t('scan_to_order')}
                </p>

                <div className="mt-14 h-1.5 w-14 bg-orange-600 rounded-full" />
            </motion.div>
        </div>
    );
};
