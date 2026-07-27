export const ALLERGEN_INFO: Record<
    string,
    { icon: string; bg: string; text: string; border: string }
> = {
    gluten: { icon: '🌾', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    trigo: { icon: '🌾', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    soja: { icon: '🌿', bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
    soy: { icon: '🌿', bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
    pescado: { icon: '🐟', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    fish: { icon: '🐟', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    crustaceos: { icon: '🦐', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
    crustáceos: { icon: '🦐', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
    marisco: { icon: '🦐', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
    huevo: { icon: '🥚', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    leche: { icon: '🥛', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    lactose: { icon: '🥛', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    lacteos: { icon: '🥛', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    lácteos: { icon: '🥛', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    cacahuete: {
        icon: '🥜',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
    },
    nuts: { icon: '🥜', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    mani: { icon: '🥜', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    sesamo: { icon: '🌱', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
    sésamo: { icon: '🌱', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
    mostaza: {
        icon: '🟡',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-100',
    },
    apio: { icon: '🥬', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
    sulfito: {
        icon: '🍷',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-100',
    },
    altramuz: { icon: '🌰', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    moluscos: { icon: '🦑', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100' },
};

export const getAllergenInfo = (allergen: string) => {
    const key = allergen.toLowerCase().trim();
    for (const [k, info] of Object.entries(ALLERGEN_INFO)) {
        if (key.includes(k)) return info;
    }
    return { icon: '⚠️', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
};

export interface AllergenDetail {
    id: string;
    nameEs: string;
    nameRu: string;
    icon: string;
    bg: string;
    text: string;
    border: string;
    descriptionEs: string;
    descriptionRu: string;
    examplesEs: string[];
    examplesRu: string[];
}

export const ALLERGEN_LIST_DETAILS: AllergenDetail[] = [
    {
        id: 'gluten',
        nameEs: 'Cereales con Gluten',
        nameRu: 'Злаки, содержащие глютен',
        icon: '🌾',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-100',
        descriptionEs:
            'Trigo, centeno, cebada, avena y productos derivados presentes en salsas, rebozados y fideos.',
        descriptionRu: 'Пшеница, рожь, ячмень, овес и их продукты в соусах, панировке и лапше.',
        examplesEs: [
            'Salsa de soja tradicional',
            'Tempura',
            'Fideos ramen',
            'Rollos fritos empanados',
        ],
        examplesRu: ['Соевый соус', 'Темпура', 'Лапша рамен', 'Жареные роллы в панировке'],
    },
    {
        id: 'fish',
        nameEs: 'Pescado',
        nameRu: 'Рыба и рыбные продукты',
        icon: '🐟',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-100',
        descriptionEs: 'Todo tipo de pescados frescos, curados o cocinados y sus derivados.',
        descriptionRu:
            'Все виды свежей, соленой и копченой рыбы (лосось, тунец, угорь, масляная рыба).',
        examplesEs: [
            'Salmón atlántico fresco',
            'Atún rojo',
            'Pez mantequilla',
            'Katsuobushi (copos de bonito)',
        ],
        examplesRu: ['Свежий лосось', 'Тунец', 'Масляная рыба', 'Стружка тунца (Кацуобуси)'],
    },
    {
        id: 'crustaceos',
        nameEs: 'Crustáceos y Mariscos',
        nameRu: 'Ракообразные и морепродукты',
        icon: '🦐',
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-100',
        descriptionEs: 'Gambas, langostinos, cangrejo y derivados marinos.',
        descriptionRu: 'Креветки, тигровые креветки, крабовый замес, сурими.',
        examplesEs: [
            'Gambas en tempura',
            'Ebi (gamba cocida)',
            'Surimi / Cangrejo',
            'Langostino panko',
        ],
        examplesRu: ['Креветки в темпуре', 'Вареная креветка Эби', 'Крабовый замес / Сурими'],
    },
    {
        id: 'soy',
        nameEs: 'Soja y derivados',
        nameRu: 'Соя и соевые продукты',
        icon: '🌿',
        bg: 'bg-stone-100',
        text: 'text-stone-700',
        border: 'border-stone-200',
        descriptionEs: 'Habas de soja, aderezos fermentados, tofu y aceites vegetales.',
        descriptionRu: 'Соевые бобы, ферментированные соусы, сыр тофу, мисо-паста.',
        examplesEs: ['Salsa de soja', 'Edamame', 'Pasta de Miso', 'Tofu orgánico'],
        examplesRu: ['Соевый соус', 'Бобы Эдамаме', 'Мисо-паста', 'Тофу'],
    },
    {
        id: 'lactose',
        nameEs: 'Lácteos y Lactosa',
        nameRu: 'Молоко и молочные продукты (Лактоза)',
        icon: '🥛',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-100',
        descriptionEs: 'Queso crema, leche, mantequilla y derivados lácteos.',
        descriptionRu: 'Сливочный сыр (Филадельфия), сливки, сырные соусы, десерты.',
        examplesEs: ['Queso crema Philadelphia', 'Salsas cremosas', 'Postres artesanales'],
        examplesRu: ['Сливочный сыр Philadelphia', 'Сливочные соусы', 'Десерты'],
    },
    {
        id: 'huevo',
        nameEs: 'Huevo y derivados',
        nameRu: 'Яйца и яичные продукты',
        icon: '🥚',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-100',
        descriptionEs: 'Huevos enteros, yema, mayonesa japonesa y empanados.',
        descriptionRu: 'Яйца, японский майонез Kewpie, яичные омлеты Тамаго.',
        examplesEs: ['Mayonesa japonesa Kewpie', 'Salsa spicy mayone', 'Tamago (tortilla dulce)'],
        examplesRu: ['Японский майонез Kewpie', 'Спайси соус', 'Омлет Тамаго'],
    },
    {
        id: 'nuts',
        nameEs: 'Frutos de cáscara / Cacahuetes',
        nameRu: 'Орехи и арахис',
        icon: '🥜',
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
        descriptionEs:
            'Almendras, avellanas, cacahuetes o nueces utilizados como toques crujientes.',
        descriptionRu: 'Арахис, миндаль, фундук, ореховые соусы и крошка.',
        examplesEs: ['Toppings crujientes', 'Salsas de cacahuete', 'Postres de nuez'],
        examplesRu: ['Ореховая крошка', 'Ореховые соусы', 'Десерты с орехами'],
    },
    {
        id: 'sesamo',
        nameEs: 'Granos de Sésamo',
        nameRu: 'Кунжут и кунжутное масло',
        icon: '🌱',
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-100',
        descriptionEs: 'Semillas de sésamo blanco y negro, aceite de sésamo tostado.',
        descriptionRu: 'Черный и белый кунжут, ароматное кунжутное масло.',
        examplesEs: ['Semillas de sésamo en Uramakis', 'Aceite de sésamo aderezado'],
        examplesRu: ['Кунжутная обсыпка Урамаки', 'Кунжутное масло'],
    },
    {
        id: 'mostaza',
        nameEs: 'Mostaza',
        nameRu: 'Горчица',
        icon: '🟡',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-100',
        descriptionEs: 'Semillas de mostaza, aderezos picantes y aliños especiales.',
        descriptionRu: 'Семена горчицы, острые японские соусы и заправки.',
        examplesEs: ['Salsas de mostaza miel', 'Wasabi preparado', 'Aliños asiáticos'],
        examplesRu: ['Горчичные соусы', 'Васаби заправка', 'Пикантные соусы'],
    },
    {
        id: 'moluscos',
        nameEs: 'Moluscos',
        nameRu: 'Моллюски',
        icon: '🦑',
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-100',
        descriptionEs: 'Pulpo, calamar, vieiras y extractos marinos.',
        descriptionRu: 'Осьминог, кальмар, морские гребешки, устричный соус.',
        examplesEs: ['Tako (pulpo cocido)', 'Calamar en tempura', 'Salsa de ostra en salteados'],
        examplesRu: ['Осьминог Тако', 'Кальмар в темпуре', 'Устричный соус'],
    },
    {
        id: 'sulfito',
        nameEs: 'Sulfitos / Dióxido de azufre',
        nameRu: 'Диоксид серы и сульфиты',
        icon: '🍷',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-100',
        descriptionEs: 'Conservantes presentes en vinos, vinagres de arroz aderezados y mirin.',
        descriptionRu: 'Консерванты в винах, рисовом уксусе и сладком кулинарном вине Мирин.',
        examplesEs: [
            'Vinagre de arroz preparado para sushi',
            'Vino Mirin',
            'Vinos y bebidas fermentadas',
        ],
        examplesRu: ['Рисовый уксус для суши-риса', 'Кулинарное вино Мирин', 'Виноградные вина'],
    },
];
