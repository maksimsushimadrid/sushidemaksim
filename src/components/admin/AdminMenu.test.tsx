import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders as render, screen, fireEvent, waitFor } from '../../test/test-utils';
import AdminMenu from './AdminMenu';
import { api } from '../../utils/api';

// Mock Lucide icons
vi.mock('lucide-react', async importOriginal => {
    const actual = await importOriginal<Record<string, any>>();
    return {
        ...actual,
        Plus: () => <div data-testid="plus" />,
        Edit2: () => <div data-testid="edit" />,
        Trash2: () => <div data-testid="trash" />,
        Search: () => <div data-testid="search" />,
        X: () => <div data-testid="x" />,
        RefreshCw: () => <div data-testid="refresh" />,
        Upload: () => <div data-testid="upload" />,
        Image: () => <div data-testid="image" />,
        SlidersHorizontal: () => <div data-testid="sliders" />,
        ArrowUp: () => <div data-testid="arrow-up" />,
        ArrowDown: () => <div data-testid="arrow-down" />,
        CheckCircle2: () => <div data-testid="check" />,
    };
});

// Mock API
vi.mock('../../utils/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
    ApiError: class ApiError extends Error {
        constructor(public message: string) {
            super(message);
        }
    },
}));

// Mock fetch for image upload
global.fetch = vi.fn();

const mockItems = [
    {
        id: 1,
        name: 'Sake Sushi',
        category: 'entrantes',
        price: 5.5,
        description: 'Test',
        image: 'https://example.com/image.jpg',
    },
];

describe('AdminMenu (Integration)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.get).mockResolvedValue({ items: mockItems });
    });

    it('renders the menu list with correctly formatted price', async () => {
        render(<AdminMenu />);

        await waitFor(() => {
            expect(screen.getByText('Sake Sushi')).toBeInTheDocument();
            expect(screen.getByText('5,50 €')).toBeInTheDocument();
        });
    });

    it('filters items by search', async () => {
        render(<AdminMenu />);

        const searchInput = await screen.findByPlaceholderText(/Buscar por nombre o categoría/i);
        fireEvent.change(searchInput, { target: { value: 'Sake' } });

        expect(screen.getByText('Sake Sushi')).toBeInTheDocument();

        fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
        expect(screen.queryByText('Sake Sushi')).not.toBeInTheDocument();
    });

    it('submits the form to add a new item', async () => {
        const newItem = { id: 2, name: 'New Roll', category: 'menus', price: 10 };
        vi.mocked(api.post).mockResolvedValue({
            item: newItem,
        });

        render(<AdminMenu />);

        const addBtn = await screen.findByText(/Nuevo Plato/i);
        fireEvent.click(addBtn);

        // Fill form
        fireEvent.change(await screen.findByLabelText(/Nombre \*/i), {
            target: { value: 'New Roll' },
        });
        fireEvent.change(screen.getByLabelText(/Descripción \*/i), { target: { value: 'Tasty' } });
        fireEvent.change(screen.getByLabelText(/Precio \(€\) \*/i), { target: { value: '10' } });
        fireEvent.change(screen.getByLabelText(/Categoría \*/i), { target: { value: 'menus' } });

        const saveBtn = screen.getByRole('button', { name: /Crear Plato/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
            expect(api.post).toHaveBeenCalledWith(
                '/admin/menu',
                expect.objectContaining({
                    name: 'New Roll',
                    price: 10,
                    category: 'menus',
                })
            );
        });
    });

    it('opens modal and updates existing item', async () => {
        render(<AdminMenu />);

        await waitFor(() => expect(screen.getByText('Sake Sushi')).toBeInTheDocument());

        const editBtn = screen.getByTitle(/Editar Plato/i);
        fireEvent.click(editBtn);

        const nameInput = screen.getByLabelText(/Nombre \*/i);
        expect(nameInput).toHaveValue('Sake Sushi');

        fireEvent.change(nameInput, { target: { value: 'Updated Sake' } });

        const saveBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith(
                '/admin/menu/1',
                expect.objectContaining({
                    name: 'Updated Sake',
                })
            );
        });
    });

    it('deletes an item after confirmation', async () => {
        vi.mocked(api.delete).mockResolvedValue({});

        render(<AdminMenu />);

        await waitFor(() => expect(screen.getByText('Sake Sushi')).toBeInTheDocument());

        const deleteBtn = screen.getByTestId('trash').parentElement!;
        fireEvent.click(deleteBtn);

        const confirmBtn = await screen.findByText(/SÍ, ELIMINAR AHORA/i);
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith('/admin/menu/1');
        });
    });

    it('handles image URL input manually', async () => {
        render(<AdminMenu />);
        fireEvent.click(await screen.findByText(/Nuevo Plato/i));

        const urlInput = screen.getByPlaceholderText(/https:\/\/.../i);
        fireEvent.change(urlInput, { target: { value: 'https://foo.com/bar.png' } });

        const previewImg = screen.getByAltText('Preview');
        expect(previewImg).toHaveAttribute('src', 'https://foo.com/bar.png');
    });

    it('shows general error message if API fails during save', async () => {
        vi.mocked(api.post).mockRejectedValue(new Error('Generic failure'));

        render(<AdminMenu />);
        fireEvent.click(await screen.findByText(/Nuevo Plato/i));

        // Fill minimum required fields
        fireEvent.change(screen.getByLabelText(/Nombre \*/i), { target: { value: 'X' } });
        fireEvent.change(screen.getByLabelText(/Descripción \*/i), { target: { value: 'X' } });

        const saveBtn = screen.getByRole('button', { name: /Crear Plato/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            // Should show the default error message from translations
            expect(screen.getByText(/Error al guardar/i)).toBeInTheDocument();
        });
    });
});
