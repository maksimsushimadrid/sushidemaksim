import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ReservationForm from '../components/reservations/ReservationForm';
import SafeImage from '../components/common/SafeImage';
import { getOptimizedImageUrl } from '../utils/images';

export default function ReservationPage() {
    return (
        <div className="min-h-screen bg-[#FBF7F0] pb-20">
            <SEO
                title="Reservar Mesa — Sushi de Maksim Madrid"
                description="Reserva tu mesa en Sushi de Maksim. Disfruta del mejor sushi de Madrid en un ambiente exclusivo. Reservas online fáciles y rápidas."
                url="https://www.sushidemaksim.com/reservar"
            />

            {/* Hero Section */}
            <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden bg-gray-900">
                <SafeImage
                    src="/blog_post_chef_hands.webp"
                    getOptimizedUrl={url => getOptimizedImageUrl(url, 1200)}
                    alt="Reserva tu mesa — Sushi de Maksim Madrid"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-transparent to-transparent"></div>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-orange-500 font-black text-xs md:text-sm uppercase tracking-[0.3em] mb-4 bg-black/20 backdrop-blur-md px-4 py-1 rounded-full"
                    >
                        Experiencia Exclusiva
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-tight"
                    >
                        Reserva tu <span className="text-orange-600">Mesa</span>
                    </motion.h1>
                </div>
            </div>

            {/* Form Section */}
            <div className="max-w-7xl mx-auto px-4 -mt-10 md:-mt-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Info Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-white/20"
                    >
                        <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">
                            Información <span className="text-orange-600 italic">Útil</span>
                        </h2>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                                    Horario de Reservas
                                </h3>
                                <p className="text-gray-600 font-medium leading-relaxed">
                                    Aceptamos reservas todos los días durante nuestro horario de
                                    apertura. Para grupos de más de 10 personas, por favor
                                    contáctanos{' '}
                                    <Link
                                        to="/contacts"
                                        className="text-orange-600 hover:text-orange-700 underline font-bold transition-colors"
                                    >
                                        directamente
                                    </Link>
                                    .
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                                    Ubicación
                                </h3>
                                <p className="text-gray-900 font-bold">
                                    C. de Barrilero, 20, 28007 Madrid España
                                </p>
                                <p className="text-gray-500 text-sm mt-1">
                                    Ubicado en el barrio de Retiro.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                                    Contacto Directo
                                </h3>
                                <a
                                    href="tel:+34631920312"
                                    className="text-gray-900 font-black text-lg hover:text-orange-600 transition-colors"
                                >
                                    +34 631 920 312
                                </a>
                                <p className="text-gray-500 text-sm mt-1">
                                    También atendemos por WhatsApp.
                                </p>
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-orange-50 rounded-3xl border border-orange-100">
                            <p className="text-orange-800 text-sm font-bold leading-relaxed italic">
                                "La frescura del mar, directamente a tu mesa en el corazón de
                                Madrid."
                            </p>
                        </div>
                    </motion.div>

                    {/* Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-8 bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/20"
                    >
                        <ReservationForm className="max-w-2xl mx-auto" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
