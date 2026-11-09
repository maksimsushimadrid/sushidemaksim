import { useEffect } from 'react';
import { useSettings } from '../../hooks/queries/useSettings';
import { SITE_URL } from '../../constants/config';

/**
 * Component to inject JSON-LD structured data into the document head.
 * This helps Google understand the site content better and show rich results (stars, address, etc).
 */
export default function Schema() {
    const { data: settings } = useSettings();

    useEffect(() => {
        if (!settings) return;

        const schemaData = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'Restaurant',
                    '@id': `${SITE_URL}/#restaurant`,
                    name: 'Sushi de Maksim',
                    image: `${SITE_URL}/og-image-v20.jpg`,
                    logo: `${SITE_URL}/logo.svg`,
                    url: `${SITE_URL}/`,
                    telephone: settings.contactPhone || '+34631920312',
                    priceRange: '€€',
                    servesCuisine: [
                        'Japanese',
                        'Sushi',
                        'Sushi artesanal',
                        'Rollos XL',
                        'Fusión japonesa',
                        'Comida para llevar',
                    ],
                    currenciesAccepted: 'EUR',
                    paymentAccepted: 'Cash, Credit Card, Bizum, Apple Pay, Google Pay',
                    areaServed: [
                        { '@type': 'AdministrativeArea', name: 'Retiro, Madrid' },
                        { '@type': 'AdministrativeArea', name: 'Adelfas, Madrid' },
                        { '@type': 'AdministrativeArea', name: 'Pacífico, Madrid' },
                        { '@type': 'AdministrativeArea', name: 'Salamanca, Madrid' },
                        { '@type': 'AdministrativeArea', name: 'Chamberí, Madrid' },
                        { '@type': 'AdministrativeArea', name: 'Arganzuela, Madrid' },
                        { '@type': 'AdministrativeArea', name: 'Centro, Madrid' },
                        { '@type': 'AdministrativeArea', name: 'Méndez Álvaro, Madrid' },
                    ],
                    knowsAbout: [
                        'Sushi artesanal',
                        'Rollos XL',
                        'Atún rojo Balfegó',
                        'Dragon Roll',
                        'Rollos fritos tempurizados',
                        'Catering japonés',
                        'Showcooking privado',
                    ],
                    sameAs: [
                        settings.contactGoogleMapsUrl ||
                            'https://www.google.com/maps/search/?api=1&query=' +
                                encodeURIComponent(
                                    'Sushi de Maksim, C. de Barrilero, 20, 28007 Madrid'
                                ),
                        'https://www.instagram.com/sushi_de_maksim/',
                        'https://wa.me/34631920312',
                        'https://t.me/sushidemaksim',
                        'https://www.thefork.es/restaurante/red-de-maksim-r753228',
                        'https://www.threads.net/@sushi_de_maksim',
                    ],
                    address: {
                        '@type': 'PostalAddress',
                        streetAddress: settings.contactAddressLine1 || 'C. de Barrilero, 20',
                        addressLocality: 'Madrid',
                        postalCode: '28007',
                        addressCountry: 'ES',
                    },
                    geo: {
                        '@type': 'GeoCoordinates',
                        latitude: 40.397042,
                        longitude: -3.672449,
                    },
                    openingHoursSpecification: [
                        {
                            '@type': 'OpeningHoursSpecification',
                            dayOfWeek: ['Wednesday', 'Thursday', 'Friday'],
                            opens: '19:00',
                            closes: '22:30',
                        },
                        {
                            '@type': 'OpeningHoursSpecification',
                            dayOfWeek: ['Saturday', 'Sunday'],
                            opens: '14:00',
                            closes: '16:00',
                        },
                        {
                            '@type': 'OpeningHoursSpecification',
                            dayOfWeek: ['Saturday', 'Sunday'],
                            opens: '19:00',
                            closes: '22:30',
                        },
                    ],
                    aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: (settings.ratingTheFork || 9.1).toString(),
                        reviewCount: (settings.ratingReviewsCount || 543).toString(),
                        bestRating: '10',
                        worstRating: '1',
                        author: {
                            '@type': 'Organization',
                            name: 'The Fork',
                        },
                    },
                    hasMenu: `${SITE_URL}/menu`,
                    acceptsReservations: 'true',
                    potentialAction: {
                        '@type': 'OrderAction',
                        target: {
                            '@type': 'EntryPoint',
                            urlTemplate: `${SITE_URL}/menu`,
                            inLanguage: 'es-ES',
                            actionPlatform: [
                                'http://schema.org/DesktopWebPlatform',
                                'http://schema.org/MobileWebPlatform',
                            ],
                        },
                        deliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModeOwnFleet'],
                    },
                },
                {
                    '@type': 'WebSite',
                    '@id': `${SITE_URL}/#website`,
                    url: `${SITE_URL}/`,
                    name: 'Sushi de Maksim',
                    description:
                        'Auténtica cocina japonesa con entrega a domicilio en Madrid. Sushi y rollos frescos.',
                    publisher: {
                        '@id': `${SITE_URL}/#restaurant`,
                    },
                    potentialAction: [
                        {
                            '@type': 'SearchAction',
                            target: {
                                '@type': 'EntryPoint',
                                urlTemplate: `${SITE_URL}/menu?search={search_term_string}`,
                            },
                            'query-input': 'required name=search_term_string',
                        },
                    ],
                },
                {
                    '@type': 'FAQPage',
                    '@id': `${SITE_URL}/#faq`,
                    mainEntity: [
                        {
                            '@type': 'Question',
                            name: '¿Dónde comer o pedir el mejor sushi artesanal en Madrid?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'Sushi de Maksim, ubicado en Calle de Barrilero, 20 (barrio de Adelfas / Retiro, Madrid), ofrece sushi artesanal de autor, rollos grandes XL, nigiris de atún rojo Balfegó y salmón noruego, con servicio en mesa, para llevar (take away) y entrega a domicilio.',
                            },
                        },
                        {
                            '@type': 'Question',
                            name: '¿Cuáles son las especialidades más populares de Sushi de Maksim?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'Las especialidades más destacadas son el Dragon Roll (langostino tempurizado y anguila ahumada), los Rollos Fritos crujientes, el Philadelphia XL con abundante salmón y queso crema, los nigiris flambeados y su cerveza artesana de elaboración propia.',
                            },
                        },
                        {
                            '@type': 'Question',
                            name: '¿Cómo hacer un pedido a domicilio o reservar mesa en Sushi de Maksim?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'Puedes pedir online directamente en https://www.sushidemaksim.com/menu para entrega rápida o recogida sin colas, o reservar mesa en https://www.sushidemaksim.com/reservar sin coste adicional. Los nuevos clientes registrados obtienen un 10% de descuento.',
                            },
                        },
                        {
                            '@type': 'Question',
                            name: '¿Tienen opciones para personas con alergias o intolerancias alimentarias?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'Sí, Sushi de Maksim cuenta con una carta interactiva con los 14 alérgenos en https://www.sushidemaksim.com/alergenos, salsa de soja sin gluten y opciones adaptadas para celíacos e intolerantes a la lactosa.',
                            },
                        },
                        {
                            '@type': 'Question',
                            name: '¿Qué precio medio tiene Sushi de Maksim?',
                            acceptedAnswer: {
                                '@type': 'Answer',
                                text: 'El precio medio por comensal oscila entre 15 € y 25 €, ofreciendo raciones generosas de calidad restaurante prémium a un precio competitivo.',
                            },
                        },
                    ],
                },
            ],
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'ld-json-schema';
        script.innerHTML = JSON.stringify(schemaData);
        document.head.appendChild(script);

        return () => {
            const existingScript = document.getElementById('ld-json-schema');
            if (existingScript) {
                existingScript.remove();
            }
        };
    }, [settings]);

    return null;
}
