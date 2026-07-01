import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, X, ChevronRight, BookOpen } from 'lucide-react';

// ── Lightweight Markdown → HTML renderer (no dependencies) ────────────────────
function mdToHtml(md: string): string {
    // Escape HTML entities in raw text but preserve code blocks
    const codeBlocks: string[] = [];
    let safe = md.replace(/```[\s\S]*?```/g, match => {
        codeBlocks.push(match);
        return `§CODE${codeBlocks.length - 1}§`;
    });

    // Inline code
    const inlineCodes: string[] = [];
    safe = safe.replace(/`([^`]+)`/g, (_, code) => {
        inlineCodes.push(code);
        return `§INLINE${inlineCodes.length - 1}§`;
    });

    // Headers
    safe = safe
        .replace(/^# (.+)$/gm, '<h1 class="guide-h1">$1</h1>')
        .replace(/^## (.+)$/gm, '<h2 class="guide-h2">$1</h2>')
        .replace(/^### (.+)$/gm, '<h3 class="guide-h3">$1</h3>');

    // Horizontal rules
    safe = safe.replace(/^---$/gm, '<hr class="guide-hr" />');

    // Blockquotes
    safe = safe.replace(/^> (.+)$/gm, '<blockquote class="guide-bq">$1</blockquote>');

    // Bold + italic
    safe = safe
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="guide-bold">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Tables
    safe = safe.replace(
        /(\|.+\|\n)((?:\|[-:]+\|)+\n)((?:\|.+\|\n?)*)/g,
        (_, header, _sep, body) => {
            const headerCells = header
                .split('|')
                .filter((c: string) => c.trim())
                .map((c: string) => `<th class="guide-th">${c.trim()}</th>`)
                .join('');
            const bodyRows = body
                .trim()
                .split('\n')
                .filter(Boolean)
                .map((row: string) => {
                    const cells = row
                        .split('|')
                        .filter((c: string) => c.trim())
                        .map((c: string) => `<td class="guide-td">${c.trim()}</td>`)
                        .join('');
                    return `<tr>${cells}</tr>`;
                })
                .join('');
            return `<div class="guide-table-wrap"><table class="guide-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
        }
    );

    // Unordered lists — group consecutive lines
    safe = safe.replace(/((?:^[ \t]*[-*] .+\n?)+)/gm, block => {
        const items = block
            .trim()
            .split('\n')
            .map(line => {
                const m = line.match(/^[ \t]*[-*] (.+)$/);
                return m ? `<li class="guide-li">${m[1]}</li>` : '';
            })
            .join('');
        return `<ul class="guide-ul">${items}</ul>`;
    });

    // Ordered lists
    safe = safe.replace(/((?:^\d+\. .+\n?)+)/gm, block => {
        const items = block
            .trim()
            .split('\n')
            .map(line => {
                const m = line.match(/^\d+\. (.+)$/);
                return m ? `<li class="guide-li">${m[1]}</li>` : '';
            })
            .join('');
        return `<ol class="guide-ol">${items}</ol>`;
    });

    // Links
    safe = safe.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="guide-link" target="_blank" rel="noopener">$1</a>'
    );

    // Paragraphs — wrap orphan text lines
    safe = safe.replace(/^(?!<[a-zA-Z§])(.+)$/gm, '<p class="guide-p">$1</p>');

    // Restore code blocks
    safe = safe.replace(/§CODE(\d+)§/g, (_, i) => {
        const block = codeBlocks[Number(i)];
        const lang = block.match(/^```(\w*)/)?.[1] || '';
        const code = block.replace(/^```\w*\n?/, '').replace(/```$/, '');
        return `<pre class="guide-pre"><code class="guide-code" data-lang="${lang}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    });

    safe = safe.replace(/§INLINE(\d+)§/g, (_, i) => {
        return `<code class="guide-inline-code">${inlineCodes[Number(i)].replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`;
    });

    return safe;
}

// ── Table of Contents extraction ──────────────────────────────────────────────
interface TocItem {
    level: number;
    text: string;
    id: string;
}

function extractToc(md: string): TocItem[] {
    const lines = md.split('\n');
    const toc: TocItem[] = [];
    for (const line of lines) {
        const m2 = line.match(/^## (.+)$/);
        const m3 = line.match(/^### (.+)$/);
        if (m2) toc.push({ level: 2, text: m2[1], id: slugify(m2[1]) });
        if (m3) toc.push({ level: 3, text: m3[1], id: slugify(m3[1]) });
    }
    return toc;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-а-яё]/gi, '')
        .trim()
        .replace(/\s+/g, '-');
}

// ── Guide markdown content (inlined) ─────────────────────────────────────────
const GUIDE_MD = `# 🍣 Инструкция по использованию Админ Панели — Sushi de Maksim

> **Адрес:** \`sushidemaksim.com/admin\`
> **Доступ:** только для пользователей с ролью \`admin\` или \`superadmin\`

---

## Навигация

Слева расположена боковая панель с **11 разделами**:

| Раздел | Иконка | Назначение |
|--------|--------|------------|
| **Dashboard** | 📊 | Общая статистика и сводка |
| **Analytics** | 📈 | Углублённая аналитика |
| **Заказы** | 📦 | Управление заказами в реальном времени |
| **Меню** | 🍱 | Редактирование блюд |
| **Пользователи** | 👥 | База клиентов |
| **Промо** | 🛍️ | Акции и промо-блоки |
| **Таблон** | 📌 | Публикации и объявления |
| **Настройки** | ⚙️ | Контакты, соцсети, расписание |
| **Резервы** | 📅 | Бронирования столов |
| **Зоны доставки** | 🗺️ | Карта и тарифы доставки |
| **Рассылка** | 🔔 | Email-подписчики |

> **Бейджи на иконках** — оранжевые кружки с цифрами означают количество **ожидающих действий**.

---

## 🔊 Звуковые уведомления

Система воспроизводит звук при каждом **новом заказе**:

- **Fanfare** (веб-заказ) — одиночный сигнал для доставки/самовывоза
- **Triple chirp** (стол) — тройной сигнал для заказов MESA

**Напоминания:** если заказ остаётся в статусе \`pending\` более 5 минут — звук повторится.

> ⚠️ При первом открытии нужно кликнуть мышью, чтобы браузер разблокировал звук.

---

## 1. Dashboard — Главная панель

- **Выручка** (сегодня / неделя / месяц)
- **Количество заказов**
- **Средний чек**
- **Самые популярные блюда**
- **Активные заказы прямо сейчас**
- **График продаж**

Данные обновляются раз в час. Для ручного обновления — кнопка **↻**.

---

## 2. Analytics — Аналитика

- Выручка в динамике
- Топ клиентов по сумме
- Анализ по методам оплаты
- Анализ по типам заказов
- Брошенные корзины

---

## 3. Заказы — Управление заказами

> Это **главный рабочий раздел** для ежедневного использования.

### Жизненный цикл заказа

\`\`\`
Оформлен (Система)
    ↓
Заказ получен         ← пуш: "Hemos recibido tu pedido"
    ↓
Заказ подтверждён     ← пуш: "Tu pedido ha sido confirmado"
    ↓
Кухня                 ← пуш: "Tu pedido ya está en la cocina"
    ↓
В пути                ← пуш: "El repartidor ya va hacia tu dirección"
    ↓
Доставлено ✅          ← пуш: "¡Gracias por tu compra! Que aproveche"
\`\`\`

> **Веб-пуш уведомления** отправляются клиенту автоматически при каждой смене статуса (если клиент разрешил уведомления). Для MESA и самовывоза тексты отличаются.

### WhatsApp-подтверждение

Кнопка **WHATSAPP** открывает готовое сообщение с номером заказа, списком блюд, адресом и методом оплаты.

### Адрес на карте

Адрес доставки — **кликабельная ссылка** (синий текст). Клик открывает Google Maps с точным адресом клиента.

### Поиск

Поиск работает по: **ID заказа**, **номеру телефона**, **промокоду**.

### Фильтры статусов

| Фильтр | Что показывает |
|--------|----------------|
| **ВСЕ АКТИВНЫЕ** | Новые, подтверждённые, в процессе |
| **Кухня** | Переданные на кухню |
| **В пути** | У курьера |
| **Доставлены** | Завершённые |
| **Отменены** | Отменённые |
| **Все** | Весь список |

---

## 4. Меню — Редактирование блюд

### Добавление блюда

1. Нажмите **+ Nuevo Producto**
2. Заполните: название, описание, цену, категорию
3. Загрузите фото
4. Нажмите **Сохранить**

### Доступные поля

| Поле | Описание |
|------|----------|
| **Активен** | Если выключено — блюдо скрыто из меню |
| **Популярное** | Помечает блюдо как рекомендуемое |
| **Аллергены** | Информация об аллергенах |

Перетащите карточки для изменения порядка.

---

## 5. Пользователи — База клиентов

### Фильтры

- **Активные** — зарегистрированные пользователи
- **Архивные** — «мягко» удалённые (soft delete: аккаунт скрыт, данные сохранены, история заказов доступна)
- **Все** — весь список

### Действия с пользователем

| Действие | Описание |
|----------|----------|
| **Изменить роль** | user / admin / waiter / moderator |
| **Верифицировать email** | Ручная верификация |
| **Архивировать** | Мягкое удаление |
| **Восстановить** | Восстановление из архива |
| **Удалить навсегда** | Только для архивных — полное необратимое удаление: стираются аккаунт, все заказы, адреса и история покупок |

> ⚠️ Смена роли доступна только \`superadmin\`. Нельзя изменить свою собственную роль.

---

## 6. Промо — Акции

Три вкладки: **Акции**, **Лояльность**, **Промокоды**.

### Генератор промокодов (для недовольных клиентов)

1. Перейдите → вкладка **Промокоды**
2. Нажмите **«Сгенерировать код»**
3. Код вида \`SPECIAL10-XXXXXX\` — одноразовый, действует **14 дней**, скидка **-10%**
4. Нажмите **«Копировать»** и отправьте клиенту в WhatsApp

### Программа лояльности

- Скидка за регистрацию (первый заказ)
- Скидка в день рождения (±3 дня)
- Бонус за каждый 5-й и 10-й заказ
- Скидка за подписку на рассылку

---

## 7. Таблон — Публикации

Модерация публикаций сообщества: **одобрить** или **отклонить**. Бейдж = сумма ожидающих постов + новых категорий.

---

## 8. Настройки / *Ajustes de Contacto* — Конфигурация

### Быстрые переключатели

| Переключатель | Действие |
|---------------|----------|
| **Закрыть заказы на сегодня** | Только будущие даты |
| **Только самовывоз сегодня** | Доставка отключена |
| **Закрыть резервы на сегодня** | Бронирование недоступно |

> «Закрыть заказы» и «Только самовывоз» взаимоисключают друг друга.

### Расписание (JSON)

\`\`\`json
[
  { "days": "Miércoles - Viernes", "hours": "19:00 - 22:30" },
  { "days": "Sábado - Domingo", "hours": "14:00 - 16:00, 19:00 - 22:30" },
  { "days": "Lunes - Martes", "hours": "Cerrado", "closed": true }
]
\`\`\`

> Нажмите **СОХРАНИТЬ ИЗМЕНЕНИЯ** после всех правок.

---

## 9. Резервы — Бронирования столов

| Статус | Описание |
|--------|----------|
| **pending** | Ожидает подтверждения |
| **confirmed** | Подтверждено |
| **cancelled** | Отменено |
| **completed** | Завершено |

---

## 10. Зоны доставки

Визуальный редактор зон на карте Мадрида. Нарисуйте полигон, задайте стоимость и минимальную сумму заказа.

---

## 11. Рассылка

Список email-подписчиков с датами подписки.

---

## 💡 Полезные советы

1. **Оставляйте вкладку открытой** — заказы мониторятся в реальном времени через WebSocket.
2. **Экран не гаснет** — включён Screen Wake Lock API.
3. **Отмена заказа** — перед отменой свяжитесь с клиентом по WhatsApp.
4. **Заказы MESA** выделены красной рамкой и пульсируют — это приоритет.
5. **Копирование ID** — кликните по номеру заказа (#XXXXX).
6. **Промокод для недовольного клиента** — Промо → Промокоды → Сгенерировать код → \`SPECIAL10-XXXXXX\` → Копировать → WhatsApp.

---

*Документация актуальна на 27 июня 2026*
`;

// ── Component ─────────────────────────────────────────────────────────────────
interface AdminGuideProps {
    language?: 'ru' | 'es';
}

export default function AdminGuide({ language = 'ru' }: AdminGuideProps) {
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const toc = useMemo(() => extractToc(GUIDE_MD), []);

    const html = useMemo(() => {
        let processed = GUIDE_MD;

        // Add IDs to h2/h3 headings for anchor scrolling
        processed = processed.replace(/^## (.+)$/gm, (_, text) => {
            return `## <span id="${slugify(text)}">${text}</span>`;
        });
        processed = processed.replace(/^### (.+)$/gm, (_, text) => {
            return `### <span id="${slugify(text)}">${text}</span>`;
        });

        return mdToHtml(processed);
    }, []);

    // Highlight search in content
    const highlightedHtml = useMemo(() => {
        if (!search.trim() || search.length < 2) return html;
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return html.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="guide-mark">$1</mark>');
    }, [html, search]);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const el = contentRef.current?.querySelector(`#${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleDownload = () => {
        const blob = new Blob([GUIDE_MD], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'admin_guide_sushidemaksim.md';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Scroll spy
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                }
            },
            { root: el, rootMargin: '-10% 0px -80% 0px', threshold: 0 }
        );
        const headings = el.querySelectorAll('[id]');
        headings.forEach(h => observer.observe(h));
        return () => observer.disconnect();
    }, []);

    const filteredToc = useMemo(() => {
        if (!search.trim()) return toc;
        return toc.filter(item => item.text.toLowerCase().includes(search.toLowerCase()));
    }, [toc, search]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner border border-orange-50 shrink-0">
                        <BookOpen size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                            {language === 'ru' ? 'Инструкция' : 'Manual de uso'}
                        </h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                            {language === 'ru'
                                ? 'Руководство по панели администратора'
                                : 'Panel de administración'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-lg"
                >
                    <Download size={16} strokeWidth={2.5} />
                    {language === 'ru' ? 'Скачать .md' : 'Descargar .md'}
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search
                    size={18}
                    strokeWidth={2}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={
                        language === 'ru' ? 'Поиск по инструкции...' : 'Buscar en el manual...'
                    }
                    className="w-full pl-12 pr-10 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 focus:outline-none transition-all shadow-sm placeholder:text-gray-400"
                />
                <AnimatePresence>
                    {search && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setSearch('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors p-1"
                        >
                            <X size={16} strokeWidth={2} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex gap-6 items-start">
                {/* Table of Contents — sticky sidebar */}
                <aside className="hidden xl:block w-64 shrink-0 sticky top-4">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">
                            {language === 'ru' ? 'Содержание' : 'Contenido'}
                        </p>
                        <nav className="space-y-0.5">
                            {filteredToc.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded-xl transition-all text-[11px] font-bold ${
                                        item.level === 3 ? 'pl-6 text-gray-400' : ''
                                    } ${
                                        activeSection === item.id
                                            ? 'bg-orange-50 text-orange-600'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    {item.level === 2 && (
                                        <ChevronRight
                                            size={12}
                                            strokeWidth={2.5}
                                            className="mt-0.5 shrink-0 opacity-60"
                                        />
                                    )}
                                    <span className="leading-tight">{item.text}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main content */}
                <div
                    ref={contentRef}
                    className="flex-1 min-w-0 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10 guide-content overflow-y-auto"
                    style={{ maxHeight: 'calc(100vh - 220px)' }}
                    dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
            </div>

            {/* Guide styles */}
            <style>{`
                .guide-content { scroll-behavior: smooth; }
                .guide-h1 { font-size: 1.6rem; font-weight: 900; color: #111; margin: 0 0 1.5rem; letter-spacing: -0.03em; line-height: 1.2; border-bottom: 3px solid #f97316; padding-bottom: 0.75rem; }
                .guide-h2 { font-size: 1.15rem; font-weight: 900; color: #111; margin: 2.5rem 0 1rem; letter-spacing: -0.02em; text-transform: uppercase; padding: 0.5rem 0 0.5rem 1rem; border-left: 4px solid #f97316; scroll-margin-top: 1rem; }
                .guide-h3 { font-size: 0.9rem; font-weight: 800; color: #374151; margin: 1.75rem 0 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; scroll-margin-top: 1rem; }
                .guide-p { font-size: 0.88rem; color: #4b5563; line-height: 1.75; margin: 0.6rem 0; font-weight: 500; }
                .guide-hr { border: none; border-top: 1px solid #f3f4f6; margin: 2rem 0; }
                .guide-bq { border-left: 3px solid #fed7aa; background: #fff7ed; padding: 0.75rem 1rem; margin: 1rem 0; border-radius: 0 1rem 1rem 0; font-size: 0.82rem; font-weight: 700; color: #9a3412; }
                .guide-bold { font-weight: 900; color: #111; }
                .guide-ul, .guide-ol { margin: 0.75rem 0 0.75rem 1.25rem; space-y: 0.25rem; }
                .guide-li { font-size: 0.88rem; color: #4b5563; line-height: 1.7; font-weight: 500; margin-bottom: 0.3rem; }
                .guide-link { color: #ea580c; font-weight: 700; text-decoration: underline; text-decoration-color: #fed7aa; }
                .guide-link:hover { color: #111; }
                .guide-table-wrap { overflow-x: auto; margin: 1.25rem 0; border-radius: 1rem; border: 1px solid #f3f4f6; }
                .guide-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
                .guide-th { background: #f9fafb; font-weight: 900; color: #111; padding: 0.6rem 1rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }
                .guide-td { padding: 0.6rem 1rem; border-bottom: 1px solid #f9fafb; color: #4b5563; font-weight: 600; font-size: 0.82rem; vertical-align: top; }
                .guide-td:first-child { font-weight: 800; color: #111; }
                .guide-pre { background: #1e1e2e; border-radius: 1rem; padding: 1.25rem 1.5rem; margin: 1rem 0; overflow-x: auto; }
                .guide-code { font-family: 'Fira Code', 'Cascadia Code', monospace; font-size: 0.8rem; color: #cdd6f4; line-height: 1.7; white-space: pre; }
                .guide-inline-code { background: #f3f4f6; border: 1px solid #e5e7eb; color: #ea580c; padding: 0.1em 0.4em; border-radius: 0.4rem; font-family: monospace; font-size: 0.82em; font-weight: 700; }
                .guide-mark { background: #fef08a; color: #111; border-radius: 2px; padding: 0 2px; }
            `}</style>
        </div>
    );
}
