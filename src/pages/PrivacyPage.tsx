import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Lock, UserCheck, Eye, Database, Mail } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <>
            <Helmet>
                <title>Política de Privacidad | Sushi de Maksim</title>
                <meta
                    name="description"
                    content="Política de privacidad de Sushi de Maksim. Conoce cómo protegemos tus datos personales y garantizamos tu seguridad en Madrid."
                />
            </Helmet>

            <div className="min-h-screen bg-[#FBF7F0] py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-orange-900/5 border border-orange-100"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0">
                                <ShieldCheck size={28} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
                                Política de <span className="text-orange-600">Privacidad</span>
                            </h1>
                        </div>

                        <div className="space-y-8 text-gray-600 leading-relaxed">
                            <section>
                                <p className="mb-4">
                                    En <strong>Sushi de Maksim</strong>, valoramos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política explica cómo recopilamos, usamos y protegemos tu información de acuerdo con el Reglamento General de Protección de Datos (RGPD).
                                </p>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                                    <Database className="text-orange-600" size={20} />
                                    Datos que recopilamos
                                </h2>
                                <p className="mb-2">Para procesar tus pedidos y mejorar tu experiencia, recopilamos:</p>
                                <ul className="list-disc ml-5 space-y-2">
                                    <li><strong>Información de contacto:</strong> Nombre, apellidos, número de teléfono y dirección de correo electrónico.</li>
                                    <li><strong>Información de entrega:</strong> Dirección completa para el envío de tus pedidos en Madrid.</li>
                                    <li><strong>Datos de navegación:</strong> Información sobre cómo utilizas nuestro sitio web para mejorar el servicio.</li>
                                </ul>
                            </section>

                            <section className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                                    <UserCheck className="text-orange-600" size={20} />
                                    Finalidad del tratamiento
                                </h2>
                                <p>Utilizamos tus datos exclusivamente para:</p>
                                <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                                    <li>Gestionar y entregar tus pedidos de sushi.</li>
                                    <li>Enviarte actualizaciones sobre el estado de tu pedido.</li>
                                    <li>Comunicarte ofertas especiales (solo si has dado tu consentimiento).</li>
                                    <li>Cumplir con nuestras obligaciones legales y contables.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                                    <Lock className="text-orange-600" size={20} />
                                    Seguridad de tus datos
                                </h2>
                                <p>
                                    Implementamos medidas técnicas y organizativas para garantizar que tu información esté segura. No vendemos ni compartimos tus datos personales con terceros para fines comerciales ajenos a Sushi de Maksim.
                                </p>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                                    <Eye className="text-orange-600" size={20} />
                                    Tus derechos
                                </h2>
                                <p className="mb-4">
                                    Tienes derecho a acceder, rectificar, limitar o solicitar la eliminación de tus datos personales en cualquier momento.
                                </p>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <Mail className="text-orange-600 shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">¿Quieres eliminar tus datos?</p>
                                        <p className="text-xs">Escríbenos a <a href="mailto:alekseevpo@gmail.com" className="text-orange-600 hover:underline">alekseevpo@gmail.com</a> y procesaremos tu solicitud de inmediato.</p>
                                    </div>
                                </div>
                            </section>

                            <div className="pt-8 border-t border-gray-100 mt-12 text-center">
                                <p className="text-sm text-gray-400">
                                    Última actualización: Mayo 2024
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
