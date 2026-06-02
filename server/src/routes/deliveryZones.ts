import { Router, Response, Request } from 'express';
import { supabase } from '../db/supabase.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { formatDeliveryZone } from '../utils/helpers.js';
import { validateResource } from '../middleware/validateResource.js';
import {
    houseNumbersQuerySchema,
    addressSearchQuerySchema,
    reverseGeocodeQuerySchema,
} from '../schemas/deliveryZone.schema.js';

import axios from 'axios';

const router = Router();

// GET /api/delivery-zones
router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response) => {
        const { data: zones, error } = await supabase
            .from('delivery_zones')
            .select('*')
            .eq('is_active', true)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        res.json({ zones: (zones || []).map(formatDeliveryZone) });
    })
);

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// Get REAL house numbers for a street using Overpass API
router.get('/house-numbers', validateResource(houseNumbersQuerySchema), async (req, res) => {
    const { street, city, lat, lon } = req.query as any;

    const cacheKey = `houses-${street}-${city}-${lat}-${lon}`.toLowerCase().trim();
    const now = Date.now();

    // Check cache for existing results

    try {
        const { data } = await supabase
            .from('geocoding_cache')
            .select('results, created_at')
            .eq('query', cacheKey)
            .maybeSingle();
        if (data) {
            const cachedTime = new Date(data.created_at).getTime();
            if (now - cachedTime < CACHE_TTL) {
                return res.json(data.results);
            }
        }
    } catch (dbErr) {
        console.error('Database cache read error (ignored):', dbErr);
    }

    try {
        // 1. Smart street cleaning (more aggressive)
        const streetPattern = (street as string)
            .replace(
                /^(Calle|Avenida|Paseo|Plaza|Vía|Av\.|C\/|Travesía)\s+(de\s+|del\s+|la\s+)?/i,
                ''
            )
            .trim();

        // 2. High-precision Overpass query (Optimized for speed)
        // Use coordinates if available for much higher precision and speed
        let areaConstraint = `area["name"="${city}"]`;
        if (lat && lon) {
            areaConstraint = `around:2000, ${lat}, ${lon}`;
        }

        const overpassQuery = `
            [out:json][timeout:30];
            (
              nwr["addr:street"~"${streetPattern}", i](${areaConstraint});
              way["name"~"${streetPattern}", i](${areaConstraint})->.street;
              nwr(around.street:100)["addr:housenumber"];
            );
            out center;
        `;

        console.log(`Fetching house numbers for: ${streetPattern} in ${city}...`);
        const response = await axios.post(
            'https://overpass-api.de/api/interpreter',
            `data=${encodeURIComponent(overpassQuery)}`,
            { timeout: 35000 }
        );

        let numbers: string[] = [];
        if (response.data && response.data.elements) {
            numbers = response.data.elements
                .map((el: any) => el.tags?.['addr:housenumber'])
                .filter((n: string | undefined): n is string => !!n);
        }

        console.log(`Found ${numbers.length} house numbers for ${streetPattern}.`);

        // 3. Robust sorting and deduplication
        const uniqueNumbers = Array.from(new Set(numbers)).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) {
                if (numA !== numB) return numA - numB;
                return a.localeCompare(b, undefined, { numeric: true });
            }
            return a.localeCompare(b, undefined, { numeric: true });
        });

        try {
            await supabase.from('geocoding_cache').upsert({
                query: cacheKey,
                results: uniqueNumbers,
                created_at: new Date().toISOString(),
            });
        } catch (dbErr) {
            console.error('Database cache write error (ignored):', dbErr);
        }

        res.json(uniqueNumbers);
    } catch (error) {
        console.error('Overpass API error:', error);
        res.json([]); // Prevent UI from hanging
    }
});

// Proxy search because Nominatim blocks direct browser access (CORS/UA)
router.get(
    '/search',
    validateResource(addressSearchQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { q } = req.query as any;

        const query = q.trim().toLowerCase();
        const now = Date.now();

        let staleResults: any = null;
        try {
            const { data } = await supabase
                .from('geocoding_cache')
                .select('results, created_at')
                .eq('query', query)
                .maybeSingle();
            if (data) {
                staleResults = data.results;
                const cachedTime = new Date(data.created_at).getTime();
                if (now - cachedTime < CACHE_TTL) {
                    return res.json(data.results);
                }
            }
        } catch (dbErr) {
            console.error('Database cache read error (ignored):', dbErr);
        }

        try {
            // Respect Nominatim's limit by spacing out requests if many users hit it
            await new Promise(r => setTimeout(r, 200));

            // Parse query for house number to improve search strategy
            const hasNumber = /\d/.test(query);
            let response;
            let mergedResults: any[] = [];

            // Extract street name and house number from query
            let streetOnly = query;
            if (hasNumber) {
                // Match patterns like "calle escano 36", "gran via 12b", "36 calle escano"
                const matchEnd = query.match(/^(.+?)\s+(\d+[a-zA-Z]?\s*)$/);
                const matchStart = query.match(/^(\d+[a-zA-Z]?)\s+(.+)$/);
                if (matchEnd) {
                    streetOnly = matchEnd[1].trim();
                } else if (matchStart) {
                    streetOnly = matchStart[2].trim();
                }
            }

            if (hasNumber) {
                // 1. Structured search with house number (best precision)
                response = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: {
                        format: 'json',
                        street: query,
                        city: 'Madrid',
                        country: 'Spain',
                        limit: 15,
                        addressdetails: 1,
                        countrycodes: 'es',
                        viewbox: '-4.65, 41.2, -3.0, 39.85',
                        bounded: 1,
                    },
                    headers: {
                        'User-Agent': 'SushiDeMaksim-App/1.0 (19fire43@gmail.com)',
                        'Accept-Language': 'es',
                    },
                });

                mergedResults = [...(response.data || [])];

                // 2. If structured search found nothing, try free-text with full query
                if (mergedResults.length === 0) {
                    await new Promise(r => setTimeout(r, 300));
                    response = await axios.get('https://nominatim.openstreetmap.org/search', {
                        params: {
                            format: 'json',
                            q: query + ', Madrid',
                            limit: 15,
                            addressdetails: 1,
                            countrycodes: 'es',
                            viewbox: '-4.65, 41.2, -3.0, 39.85',
                            bounded: 1,
                        },
                        headers: {
                            'User-Agent': 'SushiDeMaksim-App/1.0 (19fire43@gmail.com)',
                            'Accept-Language': 'es',
                        },
                    });
                    mergedResults = [...(response.data || [])];
                }

                // 3. ALWAYS also search for the street name WITHOUT the number
                // This ensures the street itself appears even if the specific house number isn't in OSM
                if (streetOnly !== query && streetOnly.length >= 3) {
                    await new Promise(r => setTimeout(r, 300));
                    const streetResponse = await axios.get(
                        'https://nominatim.openstreetmap.org/search',
                        {
                            params: {
                                format: 'json',
                                q: streetOnly + ', Madrid',
                                limit: 10,
                                addressdetails: 1,
                                countrycodes: 'es',
                                viewbox: '-4.65, 41.2, -3.0, 39.85',
                                bounded: 1,
                            },
                            headers: {
                                'User-Agent': 'SushiDeMaksim-App/1.0 (19fire43@gmail.com)',
                                'Accept-Language': 'es',
                            },
                        }
                    );

                    // Merge street-only results, avoiding OSM ID duplicates
                    const existingIds = new Set(mergedResults.map((r: any) => r.osm_id));
                    for (const item of streetResponse.data || []) {
                        if (!existingIds.has(item.osm_id)) {
                            mergedResults.push(item);
                            existingIds.add(item.osm_id);
                        }
                    }
                }

                response = { data: mergedResults };
            } else {
                // No number in query: use free-text search
                response = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: {
                        format: 'json',
                        q: query + ', Madrid',
                        limit: 50,
                        addressdetails: 1,
                        countrycodes: 'es',
                        viewbox: '-4.65, 41.2, -3.0, 39.85',
                        bounded: 1,
                    },
                    headers: {
                        'User-Agent': 'SushiDeMaksim-App/1.0 (19fire43@gmail.com)',
                        'Accept-Language': 'es',
                    },
                });
            }

            // Filter results to ensure they are strictly in the Community of Madrid
            // This prevents results from Guadalajara, Toledo, Segovia etc. from appearing
            const madridResults = response.data.filter((item: any) => {
                const dn = item.display_name.toLowerCase();
                const addr = item.address || {};
                const postcode = addr.postcode || '';

                // 1. Strict postal code check for Madrid province (28xxx)
                if (postcode.startsWith('28')) return true;

                // 2. Province or State check
                if (
                    addr.province === 'Madrid' ||
                    addr.state === 'Comunidad de Madrid' ||
                    addr.region === 'Comunidad de Madrid'
                )
                    return true;

                // 3. Fallback check for missing address object tags but presence in display name
                if (
                    dn.includes('comunidad de madrid') ||
                    (dn.includes(', madrid') && (dn.includes('españa') || dn.includes('spain')))
                )
                    return true;

                return false;
            });

            // Deduplicate visually identical results (same name and postal code)
            const uniqueResults: any[] = [];
            const seen = new Set<string>();

            for (const item of madridResults) {
                const addr = item.address || {};
                const postcode = addr.postcode || '';

                // Create a normalized identifier based on Name, Number, Street, and Postcode
                // Nominatim display_name parts are usually: [Number], Street, [District], City, [State], Postcode, Country
                const parts = item.display_name.split(',').map((p: string) => p.trim());
                const normalizedBase = parts.slice(0, 4).join(',').toLowerCase();
                const identifier = `${normalizedBase}|${postcode}`.toLowerCase();

                if (!seen.has(identifier)) {
                    seen.add(identifier);
                    uniqueResults.push(item);
                }
            }

            // Only return unique results that passed the Madrid filter.
            const finalResults = uniqueResults.slice(0, 15);

            // Update cache in database
            try {
                await supabase.from('geocoding_cache').upsert({
                    query: query,
                    results: finalResults,
                    created_at: new Date().toISOString(),
                });
            } catch (dbErr) {
                console.error('Database cache write error (ignored):', dbErr);
            }

            res.json(finalResults);
        } catch (err: any) {
            console.error('Nominatim proxy error:', err.message);

            // If we have a stale cache, return it on error instead of 429
            if (staleResults) return res.json(staleResults);

            res.status(err.response?.status || 500).json({ error: 'Search failed' });
        }
    })
);

// Proxy reverse geocode
router.get(
    '/reverse',
    validateResource(reverseGeocodeQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { lat, lon } = req.query as any;

        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                params: {
                    format: 'json',
                    lat,
                    lon,
                    zoom: 18,
                    addressdetails: 1,
                },
                headers: {
                    'User-Agent': 'SushiDeMaksim-App/1.0 (19fire43@gmail.com)',
                },
            });

            res.json(response.data);
        } catch (err: any) {
            console.error('Nominatim reverse error:', err.message);
            res.status(err.response?.status || 500).json({ error: 'Reverse geocode failed' });
        }
    })
);

export default router;
