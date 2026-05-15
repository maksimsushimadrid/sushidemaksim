/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                red: {
                    50: '#FFF8F5',
                    100: '#FFEBE0',
                    200: '#FFD1B8',
                    300: '#FFA97A',
                    400: '#FF884D',
                    500: '#FF702E',
                    600: '#F26522',
                    700: '#D9521A',
                    800: '#B34115',
                    900: '#8E3411',
                },
                orange: {
                    50: '#FFF8F5',
                    100: '#FFEBE0',
                    200: '#FFD1B8',
                    300: '#FFA97A',
                    400: '#FF884D',
                    500: '#FF702E',
                    600: '#F26522',
                    700: '#D9521A',
                    800: '#B34115',
                    900: '#8E3411',
                },
                'sushi-red': '#F26522',
                'sushi-orange': '#F26522',
                'sushi-pink': '#EC4899',
                wasabi: '#84CC16',
                soy: '#78716C',
                rice: '#FEF3C7',
            },
            zIndex: {
                sticky: '100',
                header: '500',
                fixed: '600',
                backdrop: '1000',
                modal: '1100',
                popover: '1200',
                toast: '20000',
                loading: '30000',
                max: '99999',
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
            },
        },
    },
    plugins: [],
    future: {
        hoverOnlyWhenSupported: true,
    },
};
