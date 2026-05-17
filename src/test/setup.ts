import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

// Extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Mock the ToastContext globally to prevent tests from failing due to missing Provider
vi.mock('../context/ToastContext', () => ({
    useToast: () => ({
        showToast: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Google OAuth globally
vi.mock('@react-oauth/google', () => ({
    useGoogleLogin: () => vi.fn(),
    GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});

// Mock IntersectionObserver which is missing in JSDOM but needed by Framer Motion
class IntersectionObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
});

// Mock window.scrollTo which is missing in JSDOM
Object.defineProperty(window, 'scrollTo', {
    writable: true,
    configurable: true,
    value: vi.fn(),
});

// Mock window.matchMedia which is often missing in JSDOM
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock localStorage globally
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        key: (index: number) => Object.keys(store)[index] || null,
        get length() {
            return Object.keys(store).length;
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

// Mock window.location for JSDOM stability
const locationMock = {
    href: 'http://localhost:5173/',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost:5173',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
};

Object.defineProperty(window, 'location', {
    value: locationMock,
    writable: true,
    configurable: true,
});
