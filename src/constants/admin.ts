export type AdminLanguage = 'ru' | 'es';

export const ADMIN_TRANSLATIONS = {
    ru: {
        nav: {
            dashboard: 'Дашборд',
            analytics: 'Продвинутая аналитика',
            abandoned: 'Брошенные корзины',
            orders: 'Управление заказами',
            menu: 'Управление меню',
            users: 'Пользователи и клиенты',
            promos: 'Управление акциями',
            tablon: 'Модерация Tablón',
            settings: 'Настройки контактов',
            reservations: 'Бронирование столов',
            delivery: 'Зоны доставки',
            newsletter: 'Подписчики рассылки',
            guide: 'Инструкция',
        },
        ui: {
            backToShop: 'В ресторан',
            hideHelp: 'Скрыть подсказки',
            showHelp: 'Показать подсказки',
            welcome: 'Добро пожаловать в панель администратора!',
            restricted: 'Acceso restringido',
            restrictedDesc:
                'Lo sentimos, pero se requieren privilegios de administrador para ver esta página.',
            backToHome: 'Volver al inicio',
            developedBy: 'Desarrollado con',
            by: 'por',
            rights: 'Все права защищены.',
        },
        help: {
            dashboard:
                'Это ваш главный экран. Здесь вы увидите краткий обзор состояния вашего бизнеса: сколько денег вы заработали сегодня, сколько заказов ожидают обработки и общие тенденции.',
            orders: 'Здесь вы управляете заказами. Совет: обращайте внимание на заказы со статусом "В ожидании". Вы можете изменить их статус на "Готовится", "В пути" или "Доставлен".',
            menu: 'Отсюда вы можете добавлять новые блюда, менять цены или помечать блюда акциями. Если блюдо закончилось, вы можете временно скрыть его.',
            users: 'Это справочник ваших клиентов. Вы можете видеть, кто ваши лучшие покупатели, и анализировать их историю заказов.',
            promos: 'Управляйте вашими статическими предложениями здесь. Создавайте рекламные баннеры с разными цветами и иконками.',
            tablon: 'Модерируйте объявления пользователей: одобряйте, отклоняйте посты и управляйте категориями.',
            analytics:
                'Это ваш интеллектуальный центр. Здесь вы можете увидеть, какие устройства используют клиенты, в какое время они заказывают и пиковые нагрузки.',
            abandoned:
                'Возвращайте потерянные продажи. Здесь вы увидите клиентов, которые не завершили заказ. Попробуйте написать им в WhatsApp!',
            settings:
                'Настройте контакты: меняйте свои телефоны, электронную почту и социальные сети в одном месте.',
            delivery:
                'Нарисуйте свои зоны доставки на карте. Вы можете определить разные цены и минимальные суммы заказа.',
            reservations:
                'Управляйте бронированием столиков. Просматривайте входящие запросы и подтверждайте их.',
            newsletter:
                'Здесь вы можете увидеть всех пользователей, которые подписались на вашу рассылку в футере сайта.',
        },
    },
    es: {
        nav: {
            dashboard: 'Dashboard',
            analytics: 'Analítica Avanzada',
            abandoned: 'Carritos Abandonados',
            orders: 'Gestión de Pedidos',
            menu: 'Gestión de Menú',
            users: 'Usuarios y Clientes',
            promos: 'Gestión de Promociones',
            tablon: 'Moderación Tablón',
            settings: 'Ajustes de Contacto',
            reservations: 'Reservas de Mesas',
            delivery: 'Zonas de Entrega',
            newsletter: 'Suscriptores Newsletter',
            guide: 'Manual de uso',
        },
        ui: {
            backToShop: 'Al restaurante',
            hideHelp: 'Ocultar ayudas',
            showHelp: 'Mostrar ayudas',
            welcome: '¡Bienvenido al Panel de Administración!',
            restricted: 'Acceso Restringido',
            restrictedDesc:
                'Lo sentimos, pero necesitas permisos de administrador para ver esta página.',
            backToHome: 'Volver al inicio',
            developedBy: 'Desarrollado con',
            by: 'por',
            rights: 'Todos los derechos reservados.',
        },
        help: {
            dashboard:
                'Esta es tu pantalla principal. Aquí verás un resumen rápido del estado de tu negocio: cuánto dinero has ganado hoy, cuántos pedidos están pendientes y las tendencias generales.',
            orders: 'Aquí gestionas los pedidos. Consejo: Presta atención a los pedidos con estado "Pendiente". Puedes cambiar su estado a "Preparando", "En camino" o "Entregado".',
            menu: 'Desde aquí puedes añadir nuevos platos, cambiar precios o marcar platos con promociones. Si un plato se agota, puedes ocultarlo temporalmente.',
            users: 'Este es el directorio de tus clientes. Puedes ver quiénes son tus mejores compradores y analizar su historial de pedidos.',
            promos: 'Gestiona tus ofertas estáticas aquí. Crea banners promocionales con diferentes colores, iconos y ofertas.',
            tablon: 'Modera los anuncios de la comunidad: aprueba, rechaza publicaciones y gestiona categorías.',
            analytics:
                'Este es tu centro de inteligencia. Aquí puedes ver qué dispositivos usan más tus clientes, a qué horas prefieren pedir y qué días de la semana tienes más trabajo.',
            abandoned:
                'Recupera ventas perdidas. Aquí verás clientes que añadieron platos al carrito pero no terminaron el pedido. ¡Pruéba a escribirles por WhatsApp!',
            settings:
                'Personaliza cómo te contactan tus clientes. Cambia tus teléfonos, emails y redes sociales en un solo lugar.',
            delivery:
                'Dibuja tus zonas de entrega en el mapa. Puedes definir diferentes precios y pedidos mínimos para cada zona.',
            reservations:
                'Gestiona las reservas de mesa. Revisa las solicitudes entrantes y confírmalas.',
            newsletter:
                'Aquí puedes ver a todos los usuarios que se han suscrito a tu boletín de noticias en el pie de página del sitio.',
        },
    },
} as const;
