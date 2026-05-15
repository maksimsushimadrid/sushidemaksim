import { test, expect } from '@playwright/test';

test.describe('Order Checkout Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mock date to a Saturday night (Open) + dismiss cookie banner
        await page.addInitScript(() => {
            // Saturday, March 21, 2026 at 21:00:00
            const mockDate = new Date('2026-03-21T21:00:00').getTime();
            Date.now = () => mockDate;
            const RealDate = Date;
            globalThis.Date = class extends RealDate {
                constructor(...args: any[]) {
                    if (args.length === 0) {
                        super(mockDate);
                    } else {
                        super(...(args as [any]));
                    }
                }
            } as any;

            // Dismiss cookie consent banner to prevent overlay blocking
            window.localStorage.setItem('cookieConsent', 'accepted');
        });

        // Mock menu API
        await page.route('**/api/menu**', route =>
            route.fulfill({
                status: 200,
                body: JSON.stringify({
                    items: [
                        {
                            id: 1,
                            name: 'Gyozas con carne',
                            price: 6.9,
                            category: 'entrantes',
                            is_promo: false,
                            description: 'Gyozas crujientes',
                            image: '',
                        },
                        {
                            id: 100,
                            name: 'Combo Deluxe',
                            price: 25.0,
                            category: 'menus',
                            is_promo: true,
                            description: 'Oferta especial',
                            image: '',
                        },
                    ],
                }),
            })
        );
        // Mock settings API
        await page.route('**/api/settings', route =>
            route.fulfill({
                status: 200,
                body: JSON.stringify({
                    minOrder: 0,
                    isStoreClosed: false,
                    isTodayClosed: false,
                    isPickupOnly: false,
                    freeDeliveryThreshold: 60,
                }),
            })
        );

        // Mock delivery zones
        await page.route('**/api/delivery-zones', route =>
            route.fulfill({
                status: 200,
                body: JSON.stringify({
                    zones: [
                        {
                            id: 1,
                            name: 'Centro',
                            minOrder: 0,
                            cost: 2.5,
                            postalCodes: ['28001', '28002'],
                        },
                    ],
                }),
            })
        );

        await page.route('**/api/settings', route =>
            route.fulfill({
                status: 200,
                body: JSON.stringify({
                    minOrder: 0,
                    isStoreClosed: false,
                    isTodayClosed: false,
                    isPickupOnly: false,
                    freeDeliveryThreshold: 60,
                }),
            })
        );
    });

    test('EMPTY CART: should show recommendations', async ({ page }) => {
        await page.goto('/cart');

        // Wait for recommendations block
        await expect(page.getByText(/Los Favoritos/i)).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(/Gyozas con carne/i)).toBeVisible();
    });

    test('SUCCESS: should place an order', async ({ page }) => {
        // Mock order submission
        await page.route('**/api/orders', route =>
            route.fulfill({
                status: 200,
                body: JSON.stringify({
                    success: true,
                    order: { id: 448 },
                    whatsappUrl: 'https://wa.me/test',
                }),
            })
        );

        await page.goto('/menu');
        await page.waitForLoadState('networkidle');

        // Add an item
        const gyozasText = page.getByText('Gyozas con carne');
        await expect(gyozasText).toBeVisible({ timeout: 15000 });

        const addButton = page.getByTestId('add-to-cart-button').first();
        await addButton.click();

        // Wait for cart count to update
        await expect(page.getByTestId('cart-count')).toHaveText('1');

        // Go to cart
        await page.goto('/cart');
        await page.waitForLoadState('networkidle');
        await expect(page.getByTestId('cart-summary')).toBeVisible({ timeout: 15000 });

        // Select Pickup
        await page.getByTestId('delivery-type-pickup').click({ force: true });
        await page.waitForTimeout(300);

        // Fill user info
        await page.getByPlaceholder(/Ej: Juan Pérez/i).fill('Juan Test');
        await page.getByTestId('phone-input').fill('600123456');
        await page.keyboard.press('Tab');

        // Select payment method — scroll into view first to ensure React handler fires
        const cashBtn = page.getByTestId('payment-method-cash');
        await cashBtn.scrollIntoViewIfNeeded();
        await cashBtn.click();

        // Verify payment was selected by checking the order button becomes enabled
        const orderBtn = page.getByTestId('order-button');
        await expect(orderBtn).toBeEnabled({ timeout: 10000 });
        await orderBtn.click();

        // Success check
        await expect(page.getByTestId('success-title')).toBeVisible({
            timeout: 15000,
        });
        await expect(page.getByText(/#00448/)).toBeVisible();
    });

    test('FAILURE: should block order with empty address', async ({ page }) => {
        await page.goto('/menu');
        await page.waitForLoadState('networkidle');

        // Add an item
        const addButton = page.getByTestId('add-to-cart-button').first();
        await addButton.click();

        // Wait for cart count to update
        await expect(page.getByTestId('cart-count')).toHaveText('1');

        // Go to cart
        await page.goto('/cart');
        await page.waitForLoadState('networkidle');
        await expect(page.getByTestId('cart-summary')).toBeVisible({ timeout: 15000 });

        // Select Domicilio (should be selected by default, but let's be sure)
        const domicileBtn = page.getByRole('button', { name: /Domicilio/i });
        await domicileBtn.click();

        // Ensure address prompt is visible (means no address selected)
        await expect(page.getByTestId('address-input')).toBeVisible();

        // Fill other required info
        await page.getByTestId('phone-input').fill('600123456');

        // Select payment method
        const cashBtn = page.getByRole('button', { name: /Efectivo/i });
        await cashBtn.click();

        // The button should be disabled because address is missing
        const orderBtn = page.getByTestId('order-button');
        await expect(orderBtn).toBeDisabled();

        // Should show the hint
        await expect(page.getByText(/Selecciona una dirección de entrega/i)).toBeVisible();
    });
});
