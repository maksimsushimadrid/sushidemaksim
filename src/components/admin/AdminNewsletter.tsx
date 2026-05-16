import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mail, Calendar, Download, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../utils/api';
import { AdminContentSkeleton } from '../skeletons/AdminSkeleton';

interface Subscriber {
    id: string;
    email: string;
    created_at: string;
}

interface AdminNewsletterProps {
    language?: 'ru' | 'es';
}

const TRANSLATIONS = {
    ru: {
        title: 'Подписчики рассылки',
        email: 'Email',
        date: 'Дата подписки',
        total: 'Всего подписчиков',
        search: 'Поиск по email...',
        download: 'Скачать CSV',
        noSubscribers: 'Подписчиков пока нет',
        refresh: 'Обновить',
    },
    es: {
        title: 'Suscriptores Newsletter',
        email: 'Email',
        date: 'Fecha de suscripción',
        total: 'Total de suscriptores',
        search: 'Buscar por email...',
        download: 'Descargar CSV',
        noSubscribers: 'No hay suscriptores todavía',
        refresh: 'Actualizar',
    },
};

export default function AdminNewsletter({ language = 'es' }: AdminNewsletterProps) {
    const t = TRANSLATIONS[language];
    const [search, setSearch] = useState('');

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['admin-newsletter-subscribers'],
        queryFn: async () => {
            const response = await api.get('/admin/newsletter/subscribers');
            return response.subscribers as Subscriber[];
        },
    });

    const filteredSubscribers = (data || []).filter(sub =>
        sub.email.toLowerCase().includes(search.toLowerCase())
    );

    const downloadCSV = () => {
        if (!data) return;
        const csvContent = [
            ['Email', 'Fecha'],
            ...data.map(sub => [sub.email, new Date(sub.created_at).toLocaleString()]),
        ]
            .map(e => e.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
            'download',
            `subscriptores_newsletter_${new Date().toISOString().split('T')[0]}.csv`
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return <AdminContentSkeleton />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/20">
                        <Mail size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                            {t.title}
                        </h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                            {t.total}: {data?.length || 0}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-orange-600 hover:border-orange-200 transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">{t.download}</span>
                    </button>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t.search}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent shadow-sm transition-all"
                />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="px-8 py-5">{t.email}</th>
                                <th className="px-8 py-5">{t.date}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredSubscribers.length > 0 ? (
                                filteredSubscribers.map((sub, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        key={sub.id}
                                        className="hover:bg-gray-50/80 transition-all group"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-[10px] group-hover:scale-110 transition-transform">
                                                    {idx + 1}
                                                </div>
                                                <span className="text-sm font-black text-gray-900">
                                                    {sub.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-gray-500 font-bold">
                                                <Calendar size={14} className="text-gray-300" />
                                                <span className="text-xs uppercase tracking-tight">
                                                    {new Date(sub.created_at).toLocaleDateString(
                                                        language === 'ru' ? 'ru-RU' : 'es-ES',
                                                        {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        }
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-8 py-20 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                            <Mail
                                                className="text-gray-200"
                                                size={40}
                                                strokeWidth={1}
                                            />
                                        </div>
                                        <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">
                                            {t.noSubscribers}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
