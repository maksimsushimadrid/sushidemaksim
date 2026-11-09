import express, { Router } from 'express';
import type { AddressInfo } from 'net';

/**
 * Chainable Supabase query mock. Every builder method returns the same object,
 * and the chain resolves (await / .single() / .maybeSingle()) to `result`.
 */
export function mockQuery(result: { data?: any; error?: any; count?: number | null } = {}) {
    const resolved = { data: null, error: null, count: null, ...result };
    const builder: any = new Proxy(
        {},
        {
            get(_target, prop) {
                if (prop === 'then') {
                    return (resolve: any, reject: any) =>
                        Promise.resolve(resolved).then(resolve, reject);
                }
                if (prop === 'single' || prop === 'maybeSingle') {
                    return () => Promise.resolve(resolved);
                }
                return () => builder;
            },
        }
    );
    return builder;
}

/**
 * Mounts a router on a throwaway Express app, listens on an ephemeral port
 * and returns a tiny fetch-based client. Always call `close()` afterwards.
 */
export async function startTestServer(router: Router, mountPath = '/') {
    const app = express();
    app.use(express.json());
    app.use(mountPath, router);
    // Mirror production behaviour: never leak stack traces
    app.use((err: any, _req: any, res: any, _next: any) => {
        res.status(err?.status || 500).json({ error: 'Internal error' });
    });

    const server = app.listen(0);
    await new Promise<void>(resolve => server.once('listening', () => resolve()));
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;

    const request = async (
        method: string,
        path: string,
        options: { body?: unknown; token?: string; headers?: Record<string, string> } = {}
    ) => {
        const headers: Record<string, string> = { ...(options.headers || {}) };
        if (options.body !== undefined) headers['Content-Type'] = 'application/json';
        if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
        const res = await fetch(`${baseUrl}${path}`, {
            method,
            headers,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        });
        const text = await res.text();
        let json: any = null;
        try {
            json = JSON.parse(text);
        } catch {
            json = null;
        }
        return { status: res.status, json, text, headers: res.headers };
    };

    const close = () => new Promise<void>(resolve => server.close(() => resolve()));

    return { request, close, baseUrl };
}
