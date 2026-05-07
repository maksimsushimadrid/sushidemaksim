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
                    servesCuisine: 'Japanese, Sushi',
                    sameAs: [
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
                            dayOfWeek: ['Wednesday', 'Thursday'],
                            opens: '19:00',
                            closes: '23:00',
                        },
                        {
                            '@type': 'OpeningHoursSpecification',
                            dayOfWeek: ['Friday', 'Saturday', 'Sunday'],
                            opens: '14:00',
                            closes: '23:00',
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
