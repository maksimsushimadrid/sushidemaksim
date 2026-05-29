export interface SushiItem {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category:
        | 'entrantes'
        | 'rollos-grandes'
        | 'rollos-clasicos'
        | 'rollos-fritos'
        | 'sopas'
        | 'menus'
        | 'extras'
        | 'bebidas'
        | 'postre';
    weight?: string;
    pieces?: number;
    spicy?: boolean;
    vegetarian?: boolean;
    isPromo?: boolean;
    allergens?: string[];
    isPopular?: boolean;
    isChefChoice?: boolean;
    isNew?: boolean;
}

export interface CartItem extends SushiItem {
    quantity: number;
    selectedOption?: string;
    cartItemId?: number;
    menuItemId?: number;
    isGift?: boolean;
    giftLabel?: string;
}

export interface UserAddress {
    id: string;
    label: string;
    street: string;
    house?: string;
    apartment?: string;
    city: string;
    postalCode: string;
    phone: string;
    isDefault: boolean;
    lat?: number;
    lon?: number;
}

export type OrderStatus =
    | 'waiting_payment'
    | 'pending'
    | 'received'
    | 'confirmed'
    | 'preparing'
    | 'on_the_way'
    | 'delivered'
    | 'cancelled';

export interface OrderItem {
    id: string;
    orderId?: string;
    menuItemId?: string;
    name: string;
    price: number;
    priceAtTime: number;
    quantity: number;
    image: string;
    description?: string;
    category?: SushiItem['category'];
    selectedOption?: string;
    isGift?: boolean;
    giftLabel?: string;
}

export interface UserStats {
    registrationDate: string;
    orderCount: number;
    totalSpent: number;
    avgCheck: number;
    frequency: string;
    favoriteDish: string;
}

export interface Order {
    id: string;
    userId: string; // Now always a UUID
    items?: OrderItem[];
    total: number;
    deliveryFee?: number;
    tipAmount?: number;
    deliveryAddress: string;
    phoneNumber: string;
    status: OrderStatus;
    deliveryType?: 'delivery' | 'pickup' | 'reservation' | 'table';
    tableNumber?: number;
    notes?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    createdAt: string;
    updatedAt?: string;
    estimatedDeliveryTime?: string;
    promoCode?: string;
    users?: {
        name: string;
        email: string;
        avatar?: string;
    };
    userStats?: UserStats;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    password?: string;
    avatar?: string;
    birthDate?: string;
    isBirthDateVerified?: boolean;
    addresses: UserAddress[];
    orders: Order[];
    createdAt: string;
    role?: 'user' | 'admin' | 'waiter' | 'moderator';
    isSuperadmin?: boolean;
    orderCount: number;
    totalSpent?: number;
    avgCheck?: number;
    frequency?: string;
    favoriteDish?: string;
    isVerified?: boolean;
    deletedAt?: string;
    promoCodes?: {
        code: string;
        discountPercentage: number;
        isUsed: boolean;
        createdAt: string;
    }[];
}
