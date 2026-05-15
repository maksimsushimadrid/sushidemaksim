import { test, expect } from '@playwright/test';

test.describe('Guest Checkout - Address Selection', () => {
    test.beforeEach(async ({ page, context }) => {
        // saturday night
        await context.addInitScript(() => {
            const mockDate = new Date('2026-03-21T21:00:00').getTime();
            const realDateNow = Date.now;
            const initTime = realDateNow();
            Date.now = () => mockDate + (realDateNow() - initTime);

            if (!window.sessionStorage.getItem('guest_checkout_cleared')) {
                window.localStorage.clear();
                window.localStorage.setItem('cookieConsent', 'accepted');
                window.sessionStorage.setItem('guest_checkout_cleared', 'true');
            } else {
                // Ensure even if not cleared, we have consent
                window.localStorage.setItem('cookieConsent', 'accepted');
            }
        });

        // mock settings
        await page.route('**/api/settings', route =>
            route.fulfill({
                status: 200,
                body: JSON.stringify({
                    minOrder: 10,
                    isStoreClosed: false,
                    isTodayClosed: false,
                    isPickupOnly: false,
                    freeDeliveryThreshold: 60,
                }),
            })
        );

        // mock categories
        await page.route('**/api/categories', route =>
            route.fulfill({
                status: 200,
                body: JSON.stringify([]),
            })
        );

        // mock delivery zones - include a wide zone that covers our mock address
        await page.route('**/api/delivery-zones', route =>
            route.fulfill({
                status: 200,
                body: JSON.stringify({
                    zones: [
                        {
                            id: 1,
                            name: 'Madrid Centro',
                            type: 'radius',
                            maxRadius: 10,
                            minRadius: 0,
                            cost: 2.5,
                            minOrder: 10,
                            color: '#EF4444',
                        },
                    ],
                }),
            })
        );

        // mock menu
        await page.route('**/api/menu*', route =>
            route.fulfill({
                status: 200,
                body: JSON.stringify({
                    items: [
                        {
                            id: 1,
                            name: 'Sake Sushi',
                            price: 15.0,
                            category: 'rollos-grandes',
                            is_promo: false,
                            description: 'Test',
                            image: '',
                        },
                    ],
                }),
            })
        );

        // mock address search
        await page.route('**/api/delivery-zones/search*', route =>
            route.fulfill({
                status: 200,
                body: JSON.stringify([
                    {
                        display_name: 'Calle Gran Vía, 1, 28013 Madrid, España',
                        lat: '40.4196',
                        lon: '-3.6994',
                        address: { road: 'Calle Gran Vía', house_number: '1', postcode: '28013' },
                    },
                ]),
            })
        );

        // mock reverse geocode
        await page.route('**/api/delivery-zones/reverse*', route =>
            route.fulfill({
                status: 200,
                body: JSON.stringify({
                    display_name: 'Madrid, España',
                    address: { city: 'Madrid', country: 'España' },
                }),
            })
        );
    });

    test('should allow a guest to select an address and see the delivery zone', async ({
        page,
    }) => {
        await page.goto('/menu');

        // Add item to cart
        await page.getByTestId('add-to-cart-button').first().click();

        // Wait for cart count to update
        await expect(page.getByTestId('cart-count')).toHaveText('1');

        // Go to cart
        await page.goto('/cart');
        await page.waitForLoadState('networkidle');
        await expect(page.getByTestId('cart-summary')).toBeVisible({ timeout: 15000 });

        // Open address modal
        await page.getByTestId('address-input').click({ force: true });
        await expect(page.getByPlaceholder(/calle.*número/i)).toBeVisible();

        // Search address
        const searchPromise = page.waitForResponse(
            r => r.url().includes('/api/delivery-zones/search') && r.status() === 200
        );
        await page.getByPlaceholder(/calle.*número/i).fill('Gran Via 1');
        await searchPromise;

        // Wait for results - check the list
        const result = page.getByText(/Calle Gran Vía, 1/i);
        await expect(result).toBeVisible({ timeout: 15000 });
        await result.click();

        // Check if values are filled in the readonly address block
        await expect(page.getByTestId('selected-address-name')).toContainText(/Gran Vía/i);

        await page.getByPlaceholder(/Ej: 20/i).fill('1');
        await page.getByPlaceholder(/Ej: 1B/i).fill('3A');

        // Check if zone is detected
        await expect(page.getByRole('heading', { name: /Madrid Centro/i })).toBeVisible();

        // Confirm address
        const confirmBtn = page.getByRole('button', { name: /Confirmar dirección/i });
        await expect(confirmBtn).toBeEnabled();
        await confirmBtn.click({ force: true });

        // Back on cart, check if address is displayed
        await expect(page.getByTestId('address-display')).toContainText(/Calle Gran Vía/i);
        await expect(page.getByTestId('address-display')).toContainText(/3A/i);
    });
});
