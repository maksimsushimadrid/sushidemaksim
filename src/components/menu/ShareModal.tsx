import { X, Copy, Check, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeImage from '../common/SafeImage';
import { EMOJI } from '../../constants/menu';
import { MenuItem } from '../../hooks/queries/useMenu';
import { api } from '../../utils/api';
import { SITE_URL } from '../../constants/config';

interface ShareModalProps {
    item: MenuItem | null;
    onClose: () => void;
    onCopy: (text: string) => void;
    copying: boolean;
}

export default function ShareModal({ item, onClose, onCopy, copying }: ShareModalProps) {
    if (!item) return null;

    const trackShare = async () => {
        try {
            await api.post(`/menu/${item.id}/share`);
        } catch (e) {
            console.error('Failed to track share:', e);
        }
    };

    const shareUrl = `${SITE_URL}/compartir/item/${item.id}`;
    const shareText = `¡Mira este ${item.name} en Sushi de Maksim! 🍣\n\n${item.description}\n\nPídelo aquí: ${shareUrl}`;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-black text-gray-900">Compartir</h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl mb-6 border border-gray-100 items-center">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center">
                                <SafeImage
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    fallbackContent={
                                        <span className="text-3xl grayscale opacity-30">
                                            {EMOJI[item.category] || '🍱'}
                                        </span>
                                    }
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-gray-900 truncate mb-1">
                                    {item.name}
                                </p>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                    {item.description}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {typeof navigator !== 'undefined' && navigator.share && (
                                <button
                                    onClick={() => {
                                        trackShare();
                                        navigator.share({
                                            title: item.name,
                                            text: shareText,
                                            url: shareUrl,
                                        });
                                        onClose();
                                    }}
                                    className="w-full flex items-center justify-center gap-3 bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-200 border-none cursor-pointer"
                                >
                                    <Share2 size={20} />
                                    Enviar a...
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    trackShare();
                                    onCopy(shareText);
                                }}
                                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all border-none cursor-pointer ${
                                    copying
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                            >
                                {copying ? <Check size={20} /> : <Copy size={20} />}
                                {copying ? 'Copiado' : 'Copiar link'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
