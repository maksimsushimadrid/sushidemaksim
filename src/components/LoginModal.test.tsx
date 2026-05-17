import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders as render, screen, fireEvent, waitFor, act } from '../test/test-utils';
import LoginModal from './LoginModal';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock hooks
const mockRegister = vi.fn();
const mockLogin = vi.fn();
vi.mock('../hooks/useAuth', () => ({
    useAuth: () => ({
        register: mockRegister,
        login: mockLogin,
        forgotPassword: async (email: string) => {
            await mockPost('/auth/forgot-password', { email });
            return { success: true };
        },
        resetPassword: async (email: string, code: string, newPassword: string) => {
            await mockPost('/auth/reset-password', { email, code, newPassword });
            return { success: true };
        },
        user: null,
        isAuthenticated: false,
        isLoading: false,
    }),
    AuthProvider: ({ children }: any) => <>{children}</>,
}));

const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock('../context/ToastContext', async () => {
    const actual = await vi.importActual('../context/ToastContext');
    return {
        ...(actual as any),
        useToast: () => ({
            success: mockSuccess,
            error: mockError,
        }),
    };
});

const mockPost = vi.fn();
vi.mock('../utils/api', () => ({
    api: {
        post: (...args: any[]) => mockPost(...args),
    },
}));

describe('LoginModal - General & Events', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('opens on custom events', () => {
        render(<LoginModal isOpen={true} onClose={() => {}} />);

        act(() => {
            document.dispatchEvent(
                new CustomEvent('custom:openLogin', { detail: { mode: 'register' } })
            );
        });
        expect(screen.getByText('Crea tu cuenta')).toBeInTheDocument();

        act(() => {
            document.dispatchEvent(new CustomEvent('custom:forceOpenLogin'));
        });
        expect(screen.getByText('¡Hola de nuevo!')).toBeInTheDocument();
    });

    it('toggles password visibility in login form', () => {
        render(<LoginModal isOpen={true} onClose={() => {}} initialMode="login" />);
        const passwordInput = screen.getByPlaceholderText('Tu contraseña');
        expect(passwordInput).toHaveAttribute('type', 'password');

        const toggleButton = screen.getByLabelText('Mostrar contraseña');
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('switches between modes', () => {
        render(<LoginModal isOpen={true} onClose={() => {}} initialMode="login" />);

        fireEvent.click(screen.getByText('Regístrate'));
        expect(screen.getByText('Crea tu cuenta')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Inicia sesión'));
        expect(screen.getByText('¡Hola de nuevo!')).toBeInTheDocument();
    });
});

describe('LoginModal - Authentication', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('handles login successfully', async () => {
        mockLogin.mockResolvedValue({ success: true });
        const mockOnClose = vi.fn();
        render(<LoginModal isOpen={true} onClose={mockOnClose} initialMode="login" />);

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'test@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), {
            target: { value: 'password123' },
        });

        fireEvent.submit(screen.getByText('INICIAR SESIÓN').closest('form')!);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
            expect(mockOnClose).toHaveBeenCalled();
            expect(mockSuccess).toHaveBeenCalledWith(expect.stringContaining('¡Bienvenido'));
        });
    });

    it('handles login failure', async () => {
        mockLogin.mockResolvedValue({ success: false, error: 'Credenciales inválidas' });
        render(<LoginModal isOpen={true} onClose={() => {}} initialMode="login" />);

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'test@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), {
            target: { value: 'wrong' },
        });

        fireEvent.submit(screen.getByText('INICIAR SESIÓN').closest('form')!);

        await waitFor(() => {
            expect(mockError).toHaveBeenCalledWith('Credenciales inválidas');
        });
    });
});

describe('LoginModal - Registration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the registration form when mode is register', async () => {
        render(<LoginModal isOpen={true} onClose={() => {}} initialMode="register" />);

        expect(screen.getByText('Crea tu cuenta')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Tu nombre completo')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('600 000 000')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
        expect(screen.getByText('CREAR CUENTA')).toBeInTheDocument();
    });

    it('submits the register form successfully', async () => {
        mockRegister.mockResolvedValue({ success: true });
        const mockOnClose = vi.fn();

        render(<LoginModal isOpen={true} onClose={mockOnClose} initialMode="register" />);

        fireEvent.change(screen.getByPlaceholderText('Tu nombre completo'), {
            target: { value: 'John Doe' },
        });
        fireEvent.change(screen.getByPlaceholderText('600 000 000'), {
            target: { value: '612345678' },
        });
        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'john@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Crea una contraseña segura/i), {
            target: { value: 'Password123!' },
        });

        fireEvent.submit(screen.getByTestId('register-form'));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith(
                'John Doe',
                'john@example.com',
                '+34612345678',
                'Password123!',
                undefined
            );
            // Modal stays open and shows success screen
            expect(mockOnClose).not.toHaveBeenCalled();
            expect(mockSuccess).toHaveBeenCalledWith('VERIFICA TU EMAIL');
            expect(screen.getByText(/debes activar tu cuenta/i)).toBeInTheDocument();
            expect(screen.getByText('ENTENDIDO')).toBeInTheDocument();
        });
    });

    it('shows error message on registration failure', async () => {
        mockRegister.mockResolvedValue({ success: false, error: 'Email already exists' });

        render(<LoginModal isOpen={true} onClose={() => {}} initialMode="register" />);

        fireEvent.change(screen.getByPlaceholderText('Tu nombre completo'), {
            target: { value: 'John Doe' },
        });
        fireEvent.change(screen.getByPlaceholderText('600 000 000'), {
            target: { value: '612345678' },
        });
        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'john@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/Crea una contraseña segura/i), {
            target: { value: 'Password123!' },
        });

        fireEvent.submit(screen.getByTestId('register-form'));

        await waitFor(() => {
            expect(mockError).toHaveBeenCalledWith('Email already exists');
        });
    });
});

describe('LoginModal - Password Recovery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('switches to forgot password mode and handles submission', async () => {
        mockPost.mockResolvedValue({ data: { success: true } });
        render(<LoginModal isOpen={true} onClose={() => {}} initialMode="login" />);

        fireEvent.click(screen.getByText('¿Olvidaste?'));
        expect(screen.getByText('Recuperar acceso')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.submit(screen.getByText('ENVIAR INSTRUCCIONES').closest('form')!);

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', {
                email: 'test@example.com',
            });
            expect(screen.getByText('Verifica tu email')).toBeInTheDocument();
        });
    });

    it('handles verify-sent mode buttons', () => {
        const mockOnClose = vi.fn();
        const { unmount } = render(
            <LoginModal isOpen={true} onClose={mockOnClose} initialMode="verify-sent" />
        );

        fireEvent.click(screen.getByText('Explorar Menú'));
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/menu');

        unmount();
        render(<LoginModal isOpen={true} onClose={() => {}} initialMode="verify-sent" />);
        fireEvent.click(screen.getByText('Volver al login'));
        expect(screen.getByText('¡Hola de nuevo!')).toBeInTheDocument();
    });

    it('handles password reset successfully', async () => {
        mockPost.mockResolvedValue({ data: { success: true } });
        render(<LoginModal isOpen={true} onClose={() => {}} initialMode="forgot" />);

        // 1. Forgot Password step
        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.submit(screen.getByText('ENVIAR INSTRUCCIONES').closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('Verifica tu email')).toBeInTheDocument();
        });

        // 2. Click "Introducir el código"
        fireEvent.click(screen.getByText('Introducir el código'));

        // 3. Fill PIN
        const pinInputs = screen.getAllByPlaceholderText('•');
        ['1', '2', '3', '4', '5', '6'].forEach((v, i) => {
            fireEvent.change(pinInputs[i], { target: { value: v } });
        });

        // 4. Fill Password
        fireEvent.change(screen.getByPlaceholderText('Mínimo 9 caracteres'), {
            target: { value: 'NewPassword123!' },
        });
        fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), {
            target: { value: 'NewPassword123!' },
        });

        // 5. Submit Reset
        fireEvent.submit(screen.getByText('ACTUALIZAR CONTRASEÑA').closest('form')!);

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', {
                email: 'test@example.com',
                code: '123456',
                newPassword: 'NewPassword123!',
            });
            expect(screen.getByText('¡Hola de nuevo!')).toBeInTheDocument();
        });
    });

    it('shows error when passwords do not match in reset mode', async () => {
        render(<LoginModal isOpen={true} onClose={() => {}} initialMode="forgot" />);

        // 1. Forgot Password step
        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.submit(screen.getByText('ENVIAR INSTRUCCIONES').closest('form')!);

        await waitFor(() => {
            expect(screen.getByText('Verifica tu email')).toBeInTheDocument();
        });

        // 2. Click "Introducir el código"
        fireEvent.click(screen.getByText('Introducir el código'));

        // 3. Fill PIN
        const pinInputs = screen.getAllByPlaceholderText('•');
        ['1', '2', '3', '4', '5', '6'].forEach((v, i) => {
            fireEvent.change(pinInputs[i], { target: { value: v } });
        });

        // 4. Fill Non-matching Passwords
        fireEvent.change(screen.getByPlaceholderText('Mínimo 9 caracteres'), {
            target: { value: 'Password123!' },
        });
        fireEvent.change(screen.getByPlaceholderText('Repite la contraseña'), {
            target: { value: 'different' },
        });

        fireEvent.submit(screen.getByText('ACTUALIZAR CONTRASEÑA').closest('form')!);

        expect(mockError).toHaveBeenCalledWith('Las contraseñas no coinciden');
    });

    it('toggles password visibility in reset mode', () => {
        render(<LoginModal isOpen={true} onClose={() => {}} initialMode="reset-password" />);
        const passwordInput = screen.getByPlaceholderText('Mínimo 9 caracteres');
        expect(passwordInput).toHaveAttribute('type', 'password');

        const toggleButton = screen.getByLabelText('Mostrar contraseña');
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
    });
});
