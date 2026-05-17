import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page, context }) => {
        // Set cookie consent before any script runs.
        // We only clear sushi_token once at the start.
        await context.addInitScript(() => {
            if (!window.sessionStorage.getItem('init_cleared')) {
                window.localStorage.removeItem('sushi_token');
                window.sessionStorage.setItem('init_cleared', 'true');
            }
            window.localStorage.setItem('cookieConsent', 'accepted');
        });

        // Mock only basic site requirements
        await page.route('**/api/settings', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ siteName: 'Sushi de Maksim', minOrder: 20 }),
            })
        );
        await page.route('**/api/user/active', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
        );
        await page.route('**/api/categories', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
        );

        await page.goto('/');
    });

    test('SUCCESS: should register and see the welcome message', async ({ page }) => {
        await page.route('**/api/auth/me', route =>
            route.fulfill({ status: 401, body: '{"error":"No"}' })
        );
        await page.route('**/api/auth/register', route =>
            route.fulfill({ status: 200, body: '{"success":true}' })
        );

        await page
            .getByRole('button', { name: /ACCEDER/i })
            .first()
            .click();
        await page.getByTestId('switch-to-register').click();
        await page.getByPlaceholder(/Nombre completo/i).fill('Pavel Tester');
        await page.getByPlaceholder(/600 000 000/i).fill('600111222');
        await page.getByPlaceholder(/tu@email.com/i).fill(`test-${Date.now()}@test.com`);
        await page.getByPlaceholder(/Crea una contraseña segura/i).fill('password123!');
        await page.getByRole('button', { name: /Crear cuenta/i }).click();
        await expect(page.getByText(/VERIFICA TU EMAIL/i).first()).toBeVisible({
            timeout: 20000,
        });
    });

    test('SUCCESS: should login and access profile', async ({ page }) => {
        await page.route('**/api/auth/login', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: 'fake-jwt',
                    user: { id: 1, name: 'Pavel', email: 'test@test.com' },
                }),
            })
        );

        await page.route('**/api/auth/me', async route => {
            const h = route.request().headers();
            if (h['authorization'] || h['Authorization']) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        user: {
                            id: 1,
                            name: 'Pavel',
                            email: 'test@test.com',
                            role: 'user',
                            addresses: [],
                            createdAt: new Date().toISOString(),
                        },
                    }),
                });
            } else {
                await route.fulfill({ status: 401, body: '{"error":"Unauthorized"}' });
            }
        });

        await page
            .getByRole('button', { name: /ACCEDER/i })
            .first()
            .click();
        await page.getByPlaceholder(/tu@email.com/i).fill('pavel@test.com');
        await page.getByPlaceholder(/Tu contraseña/i).fill('password123');
        await page.getByTestId('login-submit-button').click();

        await expect(page.getByRole('banner')).toContainText('Pavel', { timeout: 20000 });

        await expect(async () => {
            await page.getByText('Pavel').first().click({ force: true });
            await expect(page.getByText('Mi Perfil').first()).toBeVisible({ timeout: 2000 });
        }).toPass({ timeout: 10000 });
    });

    test('FAILURE: should show error on invalid credentials', async ({ page }) => {
        await page.route('**/api/auth/me', route =>
            route.fulfill({ status: 401, body: '{"error":"No"}' })
        );
        await page.route('**/api/auth/login', route =>
            route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Credenciales incorrectas' }),
            })
        );
        await page
            .getByRole('button', { name: /ACCEDER/i })
            .first()
            .click();
        await page.getByPlaceholder(/tu@email.com/i).fill('wrong@test.com');
        await page.getByPlaceholder(/Tu contraseña/i).fill('wrong');
        await page.getByTestId('login-submit-button').click();

        // Wait for the toast/error message
        await expect(page.getByText(/incorrect|inválid|incorrectas|error/i).first()).toBeVisible({
            timeout: 15000,
        });
    });

    test('SUCCESS: should handle password recovery flow', async ({ page }) => {
        await page.route('**/api/auth/me', route =>
            route.fulfill({ status: 401, body: '{"error":"No"}' })
        );
        await page.route('**/api/auth/forgot-password', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, message: 'Email enviado' }),
            })
        );
        await page.route('**/api/auth/reset-password', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true }),
            })
        );

        await page
            .getByRole('button', { name: /ACCEDER/i })
            .first()
            .click();
        await page.getByRole('button', { name: /Olvidé/i }).click();
        await page.getByPlaceholder(/tu@email.com/i).fill('recovery@test.com');
        await page.getByRole('button', { name: /Enviar instrucciones/i }).click();

        await expect(page.getByText(/email|enviado|revisa/i).first()).toBeVisible({
            timeout: 10000,
        });

        // 2. Click "Introducir el código"
        await page.getByRole('button', { name: /Introducir el código/i }).click();

        // 3. Fill PIN (6 separate inputs)
        const pinInputs = page.locator('input[autocomplete="one-time-code"]');
        for (let i = 0; i < 6; i++) {
            await pinInputs.nth(i).fill((i + 1).toString());
        }

        // 4. Fill new password
        await page.getByPlaceholder(/Mínimo 9 caracteres/i).fill('NewPassword123!');
        await page.getByPlaceholder(/Repite la contraseña/i).fill('NewPassword123!');

        // 5. Submit reset
        await page.getByRole('button', { name: /Actualizar contraseña/i }).click();

        // 6. Should go back to login or show success
        await expect(page.getByText(/actualizada con éxito/i).first()).toBeVisible();
    });
});
