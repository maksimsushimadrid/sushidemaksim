import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { RefreshCcw, ShieldAlert, Clock, CheckCircle2, Phone } from 'lucide-react';

export default function RefundPolicyPage() {
    return (
        <>
            <Helmet>
                <title>Política de Reembolsos y Devoluciones | Sushi de Maksim</title>
                <meta
                    name="description"
                    content="Conoce nuestra política de reembolsos y devoluciones para pedidos a domicilio en Madrid. Calidad garantizada en cada pieza de sushi."
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
                                <RefreshCcw size={28} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
                                Política de <span className="text-orange-600">Devoluciones</span>
                            </h1>
                        </div>

                        <div className="space-y-8 text-gray-600 leading-relaxed">
                            <section>
                                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                                    <ShieldAlert className="text-orange-600" size={20} />
                                    Productos Perecederos (Comida)
                                </h2>
                                <p>
                                    Debido a la naturaleza de nuestros productos (alimentos
                                    preparados y frescos), y de acuerdo con el{' '}
                                    <strong>Artículo 103 de la Ley 3/2014 de 27 de marzo</strong>{' '}
                                    sobre la Ordenación del Comercio Minorista, no se admiten
                                    devoluciones de productos alimentarios una vez entregados, por
                                    razones de higiene y seguridad alimentaria.
                                </p>
                            </section>

                            <section className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                                    <CheckCircle2 className="text-orange-600" size={20} />
                                    Garantía de Calidad
                                </h2>
                                <p className="mb-4">
                                    A pesar de no aceptar devoluciones físicas, en{' '}
                                    <strong>Sushi de Maksim</strong> nos comprometemos con tu
                                    satisfacción total. Podrás solicitar un reembolso o reposición
                                    en los siguientes casos:
                                </p>
                                <ul className="list-disc ml-5 space-y-2">
                                    <li>El producto recibido no es el que solicitaste.</li>
                                    <li>
                                        El producto presenta daños evidentes debido al transporte.
                                    </li>
                                    <li>
                                        El producto no cumple con nuestros estándares de frescura y
                                        calidad.
                                    </li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                                    <Clock className="text-orange-600" size={20} />
                                    Plazos y Procedimiento
                                </h2>
                                <p className="mb-4">
                                    Para procesar cualquier reclamación, es imprescindible:
                                </p>
                                <ol className="list-decimal ml-5 space-y-3">
                                    <li>
                                        Notificar la incidencia en un plazo máximo de{' '}
                                        <strong>30 minutos</strong> tras la recepción del pedido.
                                    </li>
                                    <li>Proporcionar una fotografía del producto afectado.</li>
                                    <li>
                                        Conservar el ticket de compra o confirmación digital del
                                        pedido.
                                    </li>
                                </ol>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    Cancelaciones
                                </h2>
                                <p>
                                    Puedes cancelar tu pedido sin coste alguno siempre que no
                                    hayamos comenzado su preparación en cocina. Una vez el pedido
                                    esté en fase de preparación o envío, no será posible realizar la
                                    cancelación ni el reembolso del importe.
                                </p>
                            </section>

                            <div className="pt-8 border-t border-gray-100 mt-12">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-1">
                                            ¿Necesitas ayuda inmediata?
                                        </h3>
                                        <p className="text-sm">
                                            Nuestro equipo de atención al cliente te atenderá
                                            encantado.
                                        </p>
                                    </div>
                                    <a
                                        href="tel:+34631920312"
                                        className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 active:scale-95"
                                    >
                                        <Phone size={18} />
                                        +34 631 920 312
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
