/**
 * Shared helpers used across multiple route files.
 * Provides clean camelCase formatting for frontend consumption.
 */

/** Cleanly maps a menu item from DB (snake_case) to Frontend (camelCase) - PUBLIC version */
export function formatMenuItem(item: any) {
    if (!item) return null;
    return {
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        image: item.image,
        category: item.category,
        weight: item.weight,
        pieces: item.pieces,
        spicy: !!item.spicy,
        vegetarian: !!item.vegetarian,
        isPromo: !!item.is_promo,
        isPopular: !!item.is_popular,
        isChefChoice: !!item.is_chef_choice,
        isNew: !!item.is_new,
        allergens: Array.isArray(item.allergens) ? item.allergens : [],
    };
}

/** Cleanly maps a menu item from DB (snake_case) to Frontend (camelCase) - ADMIN version */
export function formatAdminMenuItem(item: any) {
    if (!item) return null;
    return {
        ...formatMenuItem(item),
        costPrice: Number(item.cost_price || 0),
    };
}

/** Cleanly maps a user from DB (snake_case) to Frontend (camelCase) */
export function formatUser(
    u: any,
    orderCount: number = 0,
    addresses: any[] = [],
    totalSpent: number = 0,
    avgCheck: number = 0,
    frequency: string = 'N/A',
    favoriteDish: string = 'N/A',
    promoCodes: any[] = []
) {
    if (!u) return null;
    return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        role: u.role,
        isSuperadmin: !!u.is_superadmin,
        isVerified: !!u.is_verified,
        birthDate: u.birth_date,
        isBirthDateVerified: !!u.birth_date_verified,
        createdAt: u.created_at,
        lastSeenAt: u.last_seen_at,
        deletedAt: u.deleted_at,
        coinsBalance: Number(u.coins_balance || 0),
        orderCount: orderCount,
        totalSpent: totalSpent,
        avgCheck: avgCheck,
        frequency: frequency,
        favoriteDish: favoriteDish,
        addresses: (addresses || []).map(a => ({
            id: a.id,
            label: a.label,
            street: a.street,
            house: a.house,
            apartment: a.apartment,
            city: a.city,
            postalCode: a.postal_code,
            phone: a.phone,
            isDefault: !!a.is_default,
            lat: a.lat,
            lon: a.lon,
        })),
        promoCodes: (promoCodes || []).map(p => ({
            code: p.code,
            discountPercentage: p.discount_percentage,
            isUsed: !!p.is_used,
            createdAt: p.created_at,
        })),
    };
}

/** Cleanly maps an order from DB (snake_case) to Frontend (camelCase) */
export function formatOrder(o: any, userStats: any = null) {
    if (!o) return null;
    const allItems = (o.order_items || o.items || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        menuItemId: Number(item.menu_item_id),
        name: item.name,
        price: Number(item.price),
        priceAtTime: Number(item.price_at_time || item.price),
        quantity: Number(item.quantity),
        image: item.image,
        description: item.description,
        category: item.category,
        selectedOption: item.selected_option,
    }));

    // Extract the special delivery item (id: -1 or by name)
    const deliveryItem = allItems.find(
        (i: any) => i.menuItemId === -1 || i.name === 'Gastos de Envío'
    );
    const deliveryFee = deliveryItem ? deliveryItem.priceAtTime : 0;

    const tipItem = allItems.find(
        (i: any) => i.name === 'Propina equipo' || i.name?.toLowerCase().includes('propina')
    );
    const tipAmount = tipItem ? tipItem.priceAtTime : 0;

    // Filter out delivery item from the regular items list if needed,
    // or keep it but let the UI filter.
    // We'll keep all for now but provide the helper field.
    const items = allItems.filter((i: any) => i.menuItemId !== -1);

    return {
        id: o.id,
        userId: o.user_id,
        total: Number(o.total),
        deliveryFee,
        tipAmount,
        coinsEarned: Number(o.coins_earned || 0),
        coinsSpent: Number(o.coins_spent || 0),
        deliveryAddress: o.delivery_address,
        phoneNumber: o.phone_number,
        status: o.status,
        notes: o.notes,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        estimatedDeliveryTime: o.estimated_delivery_time,
        promoCode: o.promo_code,
        deliveryType: o.delivery_type,
        items,
        users: o.users
            ? {
                  name: o.users.name,
                  email: o.users.email,
                  avatar: o.users.avatar,
              }
            : undefined,
        userStats: userStats || o.userStats || undefined,
    };
}

/** Cleanly maps a delivery zone from DB (snake_case) to Frontend (camelCase) */
export function formatDeliveryZone(z: any) {
    if (!z) return null;
    return {
        id: z.id,
        name: z.name,
        cost: Number(z.cost),
        minOrder: Number(z.min_order || 0),
        color: z.color,
        opacity: Number(z.opacity || 0.3),
        coordinates: z.coordinates,
        isActive: !!z.is_active,
        type: z.type || 'polygon',
        minRadius: z.min_radius ? Number(z.min_radius) : 0,
        maxRadius: z.max_radius ? Number(z.max_radius) : 0,
        freeThreshold: z.free_threshold ? Number(z.free_threshold) : null,
    };
}

/** Cleanly maps a blog post from DB (snake_case) to Frontend (camelCase) */
export function formatBlogPost(p: any) {
    if (!p) return null;
    return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        imageUrl: p.image_url,
        author: p.author,
        readTime: Number(p.read_time),
        category: p.category,
        published: !!p.published,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    };
}

/** Cleanly maps a Tablón post from DB to Frontend, with privacy controls */
export function formatTablonPost(
    p: any,
    isAuthenticated: boolean,
    commentCount: number = 0,
    reactionsData: any[] = [],
    currentUserId: string | null = null
) {
    if (!p) return null;
    const user = p.users;
    const category = p.tablon_categories;

    // Aggregate reactions
    const reactions: Record<string, number> = {};
    let userReaction: string | null = null;

    reactionsData.forEach(r => {
        reactions[r.reaction_type] = (reactions[r.reaction_type] || 0) + 1;
        if (currentUserId && r.user_id === currentUserId) {
            userReaction = r.reaction_type;
        }
    });

    return {
        id: p.id,
        userId: p.user_id,
        category: category ? { id: category.id, name: category.name, emoji: category.emoji } : null,
        tags: p.tags || [],
        message: p.message,
        whatsappPhone: isAuthenticated ? p.whatsapp_phone : null,
        images: p.images || [],
        isApproved: !!p.is_approved,
        moderationStatus: p.moderation_status || 'pending',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        commentCount,
        reactions,
        userReaction,
        author: isAuthenticated
            ? { id: user?.id, name: user?.name || 'Usuario', avatar: user?.avatar || null }
            : { id: null, name: null, avatar: null },
    };
}

/** Cleanly maps a Tablón comment from DB to Frontend, with privacy controls */
export function formatTablonComment(
    c: any,
    isAuthenticated: boolean,
    reactionsData: any[] = [],
    currentUserId: string | null = null
) {
    if (!c) return null;
    const user = c.users;

    // Aggregate reactions
    const reactions: Record<string, number> = {};
    let userReaction: string | null = null;

    reactionsData.forEach(r => {
        reactions[r.reaction_type] = (reactions[r.reaction_type] || 0) + 1;
        if (currentUserId && r.user_id === currentUserId) {
            userReaction = r.reaction_type;
        }
    });

    return {
        id: c.id,
        postId: c.post_id,
        userId: c.user_id,
        parentId: c.parent_id || null,
        message: c.message,
        createdAt: c.created_at,
        reactions,
        userReaction,
        author: isAuthenticated
            ? { id: user?.id, name: user?.name || 'Usuario', avatar: user?.avatar || null }
            : { id: null, name: null, avatar: null },
    };
}

/** Madrid Time Helpers */
export function getMadridStartOfDay() {
    const madridNowString = new Date().toLocaleString('en-US', {
        timeZone: 'Europe/Madrid',
        hour12: false,
    });
    const madridDate = new Date(madridNowString);
    const madridMidnight = new Date(madridDate);
    madridMidnight.setHours(0, 0, 0, 0);
    const msSinceMidnightInMadrid = madridDate.getTime() - madridMidnight.getTime();
    return new Date(Date.now() - msSinceMidnightInMadrid);
}

export function getMadridYesterdayStartOfDay() {
    const today = getMadridStartOfDay();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday;
}

export function getMadridHour() {
    return parseInt(
        new Date().toLocaleString('en-GB', {
            timeZone: 'Europe/Madrid',
            hour: '2-digit',
            hour12: false,
        })
    );
}

/** Get today's date in YYYY-MM-DD format (Madrid time) */
export function getMadridTodayString() {
    return new Date().toLocaleDateString('en-CA', {
        timeZone: 'Europe/Madrid',
    });
}

/**
 * Validates if a string is a valid UUID format (v4 or similar).
 * Prevents PostgreSQL 'invalid input syntax for type uuid' 500 errors.
 */
export function isValidUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
/**
 * Calculates user statistics based on their order history.
 */
export function calculateUserStats(userOrders: any[]) {
    const orderCount = userOrders.length;
    const totalSpent = userOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const avgCheck = orderCount > 0 ? Math.round((totalSpent / orderCount) * 100) / 100 : 0;

    // Favorite dish calculation
    const dishCounts: Record<string, number> = {};
    userOrders.forEach((o: any) => {
        // Handle both 'order_items' and 'items' (Supabase alias)
        const items = o.order_items || o.items || [];
        items.forEach((item: any) => {
            const name = item.name;
            const qty = Number(item.quantity || 1);
            dishCounts[name] = (dishCounts[name] || 0) + qty;
        });
    });

    let favoriteDish = 'N/A';
    let maxQty = 0;
    Object.entries(dishCounts).forEach(([name, qty]) => {
        if (qty > maxQty) {
            maxQty = qty;
            favoriteDish = name;
        }
    });

    // Frequency calculation
    let frequency = 'N/A';
    if (orderCount > 1) {
        const sortedOrders = [...userOrders].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const firstOrder = new Date(sortedOrders[0].created_at);
        const lastOrder = new Date(sortedOrders[orderCount - 1].created_at);
        const daysDiff = (lastOrder.getTime() - firstOrder.getTime()) / (1000 * 3600 * 24);
        const avgDays = daysDiff / (orderCount - 1);

        // Localization is handled on frontend, but we provide base strings
        if (avgDays < 1) frequency = 'Varias veces al día';
        else if (avgDays < 2) frequency = 'Diariamente';
        else if (avgDays < 7) frequency = 'Semanalmente';
        else frequency = `Cada ${Math.round(avgDays)} días`;
    } else if (orderCount === 1) {
        frequency = 'Primer pedido';
    }

    return {
        orderCount,
        totalSpent,
        avgCheck,
        frequency,
        favoriteDish,
    };
}
