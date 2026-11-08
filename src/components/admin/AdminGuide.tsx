import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, X, ChevronRight } from 'lucide-react';

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

    // Blockquotes — group consecutive lines into a single callout
    safe = safe.replace(/((?:^> .+\n?)+)/gm, block => {
        const lines = block
            .trim()
            .split('\n')
            .map(l => l.replace(/^> /, '').trim())
            .join('<br />');
        return `<blockquote class="guide-bq">${lines}</blockquote>`;
    });

    // Bold + italic
    safe = safe
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="guide-bold">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Tables (fixed multi-column separator regex)
    safe = safe.replace(
        /(\|.+\|\n)(\|(?:[ \t]*[-:]+[ \t]*\|)+\n)((?:\|.+\|\n?)*)/g,
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
                    return `<tr class="guide-tr">${cells}</tr>`;
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
        const code = block
            .replace(/^```\w*\n?/, '')
            .replace(/```$/, '')
            .trimEnd();
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
    const usedIds = new Map<string, number>();

    const getUniqueId = (rawText: string) => {
        const base = slugify(rawText) || 'section';
        const count = usedIds.get(base) || 0;
        usedIds.set(base, count + 1);
        return count === 0 ? base : `${base}-${count + 1}`;
    };

    for (const line of lines) {
        const m2 = line.match(/^## (.+)$/);
        const m3 = line.match(/^### (.+)$/);
        if (m2) toc.push({ level: 2, text: m2[1], id: getUniqueId(m2[1]) });
        if (m3) toc.push({ level: 3, text: m3[1], id: getUniqueId(m3[1]) });
    }
    return toc;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9а-яёáéíóúüñ\s-]/gi, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// ── Guide markdown content (RU + ES) ──────────────────────────────────────────
const GUIDE_MD_RU = `# 🍣 Инструкция по панели управления — Sushi de Maksim

> **Адрес:** \`sushidemaksim.com/admin\`
> **Доступ:** только для пользователей с ролью \`admin\` (Админ) или \`superadmin\` (Владелец). Пользователи с ролью \`waiter\` автоматически перенаправляются в терминал официанта (\`/waiter\`).

---

## Навигация

В боковом меню расположены **12 разделов**:

| Раздел | Назначение |
|--------|------------|
| **Дашборд** | Сводка показателей, выручка, время доставки, ТОП-10 блюд и недельные отчёты |
| **Аналитика** | LTV, маржа, устройства, часы пик, эффективность акций и брошенные корзины |
| **Заказы** | Управление заказами в реальном времени, печать чеков и связь по WhatsApp |
| **Меню** | Блюда, себестоимость, метки, аллергены и управление порядком категорий |
| **Клиенты** | База пользователей, статистика покупок, верификация, роли и архив |
| **Акции** | Промо-баннеры, программа лояльности и генератор спец-кодов |
| **Модерация Tablón** | Одобрение публикаций сообщества, категорий и синхронизация с Threads |
| **Настройки** | Стоп-переключатели на сегодня, сезонные темы, отпуска, контакты и рейтинги |
| **Бронирования** | Заявки на резерв столов, статусы и быстрый ответ в WhatsApp |
| **Зоны доставки** | Карта зон доставки (полигоны и радиусы), стоимость и порог бесплатной доставки |
| **Рассылка** | База подписчиков Newsletter с поиском и экспортом в CSV |
| **Инструкция** | Справочное руководство по работе с панелью |

> **Индикаторы (бейджи) в меню:** оранжевые счётчики показывают количество ожидающих заказов, новых клиентов за последние 24 часа, постов на модерации в Tablón и новых заявок на бронирование столов.

---

## 🔊 Звуковые уведомления

Панель мониторит новые заказы и бронирования в реальном времени через Supabase Realtime:

- **Одиночный сигнал (Fanfare)** — новый заказ на доставку/самовывоз или новая заявка на бронирование стола.
- **Тройной сигнал (Triple Chirp)** — приоритетный заказ со стола в ресторане (**СТОЛ / MESA**).
- **Повторное напоминание:** если заказ или бронь остаётся в статусе ожидания дольше **5 минут**, звуковой сигнал повторяется автоматически.

> ⚠️ При первом входе кликните в любом месте экрана, чтобы браузер разблокировал автовоспроизведение звука. Проверить или отключить звук можно кнопками в разделе **Заказы**.

---

## 1. Дашборд

Главная сводка показателей ресторана:

- **Финансы и трафик:** выручка за сегодня и за 30 дней, уникальные посещения сайта (сегодня / 30 дней), конверсия зарегистрированных клиентов в покупку.
- **Оперативные счётчики:** новые заказы за сегодня, ожидающие обработки заказы, новые и все зарегистрированные клиенты.
- **Время доставки:** быстрое изменение ориентировочного времени доставки прямо с главного экрана.
- **ТОП-10 товаров за месяц** и список **последних заказов**.
- **История еженедельных отчётов:** таблица по неделям (заказы, доход, средний чек) с возможностью открыть детальную разбивку по каждому дню недели.

---

## 2. Аналитика

Углублённая бизнес-аналитика за последние 30 дней:

- **Ключевые метрики:** средний LTV (пожизненная ценность клиента), средний чек, удержание (доля повторных клиентов), **оценочная маржа и наценка** (рассчитываются автоматически на основе себестоимости блюд).
- **Аудитория и техника:** распределение по устройствам (мобильные, ПК, планшеты), браузерам и соотношение новых и повторных клиентов.
- **Продажи и нагрузка:** график роста продаж, эффективность категорий меню и **пики активности по часам** для планирования загрузки кухни.
- **Маркетинг и меню:** эффективность акций и промо-кампаний, вовлечённость по блюдам (просмотры, добавления в избранное ❤️, репосты) и список **брошенных корзин**.

---

## 3. Заказы

> Главный рабочий экран для ежедневной приёмки и ведения заказов.

### Жизненный цикл заказа и Web Push уведомления

Названия этапов и текст автоматических Push-уведомлений клиенту адаптируются под тип заказа (**Доставка**, **Самовывоз**, **Стол / MESA**):

| Этап | Доставка | Самовывоз | Стол (MESA) | Push-уведомление клиенту |
|------|----------|-----------|-------------|--------------------------|
| **0. Оплата** | Ожидание оплаты | Ожидание оплаты | Ожидание оплаты | Ожидание подтверждения онлайн-оплаты |
| **1. Создание** | Оформлен (Система) | Оформлен (Система) | Оформлен (Система) | Заказ зарегистрирован в системе |
| **2. Принят** | Заказ оформлен | Заказ получен | Заказ оформлен | *«Hemos recibido tu pedido...»* |
| **3. Подтверждён** | Заказ подтвержден | Заказ подтвержден | Заказ подтвержден | *«Tu pedido ha sido confirmado.»* |
| **4. Готовится** | Доставка (Кухня) | Передан кухне | Кухня (Зал) | *«Tu pedido ya está en la cocina.»* |
| **5. Готов / В пути** | Доставка (В пути) | Готов и ожидает клиента | Зал (Подача) | *«El repartidor ya va hacia tu dirección.»* / *«Tu pedido está listo...»* |
| **6. Завершён ✅** | Заказ доставлен | Заказ выдан | Заказ подан | *«¡Gracias por tu compra! Que aproveche.»* |
| **Отмена ❌** | Отменен | Отменен | Отменен | *«Tu pedido ha sido cancelado.»* |

### Что происходит автоматически при статусе «Заказ доставлен»

1. **Промокод на каждый 5-й заказ:** после 4-го, 9-го, 14-го доставленного заказа клиенту автоматически генерируется и отправляется на почту персональный код \`LOYALTY{X}-XXXXX\` (если включено в разделе Акции → Лояльность).
2. **Подарочный десерт на 10-й заказ:** после 9-го, 19-го доставленного заказа клиенту отправляется промокод \`DESSERT-XXXXX\` на бесплатный десерт к следующему заказу.
3. **Реферальный бонус (Invita y Gana):** если в заказе был применён реферальный код друга (\`REF-XXXXXXXX\`), пригласившему пользователю автоматически начисляются **5 Maksim Coins (5€)**.

### Инструменты в карточке заказа

- **Фильтры:** \`ВСЕ АКТИВНЫЕ\`, \`Ожидание оплаты\`, \`Кухня\`, \`В пути\`, \`Доставлены\`, \`Отменены\`, \`Все\`, а также \`Удалённые\` (архивные заказы с возможностью восстановления).
- **Карточка клиента:** при наведении на имя клиента всплывает статистика (всего заказов, вложено €, средний чек, частота покупок, любимое блюдо).
- **Источник и устройство:** отображается точное устройство, ОС и браузер клиента (например, \`МОБ. (IOS) • SAFARI\` или \`ПК (MACOS) • CHROME\`).
- **Специальные пометки:** \`ЗАКАЗ КО ВРЕМЕНИ\`, \`БЕЗ ЗВОНКА\`, \`В ТЕЛЕФОН (НЕ ЗВОНОК)\`, \`СТОЛ\`.
- **Печать чека (🖨️):** мгновенный вывод термочека на печать.
- **WhatsApp и Карта:** кнопка **WHATSAPP** формирует готовое сообщение с составом заказа, а клик по адресу открывает точку в Google Maps.

---

## 4. Меню

### Добавление и редактирование блюд

1. Нажмите **+ Новое блюдо**.
2. Заполните обязательные поля: **Название**, **Категория**, **Цена (€)**, **Себестоимость (€)** (нужна для расчёта маржи в аналитике) и **Описание**.
3. При необходимости укажите количество кусочков, вес в граммах и отметьте **Аллергены**.
4. Загрузите фото с устройства (система автоматически сожмёт и конвертирует его в формат \`WebP\`) или вставьте ссылку.
5. Установите нужные метки: **Популярное**, **Выбор шефа (CHEF)**, **Новинка**, **Острое**, **Вегетарианское**, **Акция**.

> На сайте у каждого блюда также отображается счётчик сердечек ❤️ (сколько клиентов добавили блюдо в избранное; 1 клиент = максимум 1 лайк на блюдо).

### Управление категориями

Нажмите кнопку **Категории**, чтобы:
- Изменить порядок отображения категорий на сайте кнопками **Вверх / Вниз**.
- Создать новую категорию, выбрав для неё название, идентификатор (\`slug\`), иконку и описание.

---

## 5. Клиенты

- **Фильтры:** \`Только активные\`, \`Только в архиве\`, \`Все\`.
- **Сортировка:** кликните по заголовку любого столбца (ID, Имя/Email, Заказы, Потрачено, Активность, Рег., Роль).
- **Верификация:** видно статус подтверждения Email и даты рождения (с возможностью подтвердить Email вручную в один клик).

| Действие | Описание |
|----------|----------|
| **Сменить роль** | Назначение роли: \`Владелец (superadmin)\`, \`Админ (admin)\`, \`Официант (waiter)\`, \`Модератор (moderator)\`, \`Клиент (user)\` |
| **Подтвердить Email** | Ручная верификация почты без отправки письма |
| **Архивировать** | Мягкое удаление (аккаунт скрыт, но история заказов и аналитика сохраняются) |
| **Восстановить** | Возврат архивного пользователя в список активных |
| **Удалить навсегда** | Полное необратимое удаление аккаунта, заказов, адресов и избранного (доступно только для архивных аккаунтов) |

> ⚠️ Изменять роли пользователей может только **Владелец (\`superadmin\`)**. Свою собственную роль изменить или удалить нельзя.

---

## 6. Акции

Раздел разделён на 3 вкладки:

### 1. Вкладка «Акции» (Баннеры и карточки)
- Создание визуальных акций двух типов: **Карточка** (в сетке) или **Баннер** (на всю ширину экрана с кнопкой действия и сеткой из 3–4 дополнительных фото).
- Поддерживается перетаскивание карточек мышью (**Drag & Drop**) для изменения порядка их показа на сайте.

### 2. Вкладка «Лояльность»
Мгновенная настройка автоматических бонусов и скидок:
- **Скидка за регистрацию** (применяется автоматически к первому заказу; для гостей отображается в виде плавающего подарка \`DESCUENTO 10%\`).
- **С днём рождения** (действует за 3 дня до и 3 дня после даты рождения).
- **Каждый 5-й заказ** (процентная скидка на каждый пятый заказ).
- **Каждый 10-й заказ** (специальный подарок — бесплатный десерт).
- **Newsletter Подписка** (скидка за подписку на новости в футере сайта).

### 3. Вкладка «Промокоды»
- **Генератор спец-кодов:** в один клик создаёт одноразовый промокод вида \`SPECIAL10-XXXXXX\` на скидку **-10%** со сроком действия **14 дней** (удобно для быстрой компенсации клиенту в WhatsApp).

---

## 7. Модерация Tablón

Управление доской объявлений и публикаций сообщества:

- **Ожидают / Опубликовано:** одобрение, отклонение или снятие постов с публикации, быстрый переход в WhatsApp автора.
- **Категории:** модерация новых категорий, предложенных пользователями.
- **Интеграция с Threads:** подключение аккаунта и кнопка **Синхронизация Threads** для автоматического импорта новых публикаций.

---

## 8. Настройки

### Оперативные переключатели на сегодня

| Переключатель | Действие |
|---------------|----------|
| **Закрыть заказы на сегодня** | Приём заказов на текущий день закрыт (клиенты могут оформить предзаказ только на будущие даты) |
| **Только самовывоз на сегодня** | Доставка на сегодня временно отключена, доступен только самовывоз из ресторана |
| **Закрыть резервы на сегодня** | Бронирование столиков на сегодня закрыто (доступны только следующие дни) |

### Праздничное оформление и сезонные темы
Клик по карточке **мгновенно** меняет атмосферу на сайте (в самой админке эффекты отключены, чтобы не мешать работе):
- **Автоматически по датам** (Хэллоуин до 1 ноября, Новый год в декабре)
- **Обычный режим** (стандартный фон без спецэффектов)
- **Новый Год** / **Рождество** (праздничная тема и падающие снежинки ❄️)
- **Хэллоуин (Полный)** / **Хэллоуин (Только обои)**
- Отдельный переключатель **Анимации (мыши, паук, снег)** позволяет оставить сезонные обои, но выключить падающие/летающие элементы.

### Специальные закрытия, контакты и рейтинги
- **Периоды закрытия (Отпуск / Праздники):** укажите дату начала, дату окончания и причину — сайт автоматически предупредит клиентов.
- **Контакты и соцсети:** телефон, email, адрес, автогенерация ссылки Google Maps, ссылки на соцсети.
- **Внешние рейтинги:** актуальные оценки **TheFork**, **Google** и общее количество отзывов.
- **Расписание (JSON):** редактирование часов работы по дням недели (после правок нажмите **Сохранить изменения**).

---

## 9. Бронирования

Управление резервами столиков:
- **Фильтры:** \`Все\`, \`Ожидают\`, \`Подтверждены\`, \`Отменены\`.
- **Действия:** подтвердить бронь, отменить, вернуть в ожидание, удалить или связаться с гостем в один клик через кнопку **WhatsApp**.

---

## 10. Зоны доставки

Интерактивная карта Мадрида для расчёта стоимости доставки:
- Поддерживаются **2 режима зон**:
  1. **Полигон (вручную)** — произвольная область, нарисованная точками на карте.
  2. **Радиус (круг)** — кольцо с минимальным и максимальным радиусом в километрах от ресторана.
- Для каждой зоны задаются: **Название**, **Цена доставки (€)**, **Мин. заказ (€)**, **Бесплатно от (€)**, цвет и прозрачность.

---

## 11. Рассылка

База email-подписчиков из футера сайта:
- Быстрый поиск по email-адресу.
- Кнопка **Скачать CSV** выгружает актуальную базу подписчиков с датами подписки в табличный файл.

---

## 💡 Полезные советы на каждый день

1. **Держите вкладку открытой:** заказы и бронирования обновляются мгновенно без перезагрузки страницы, а экран защищён от угасания (Wake Lock).
2. **Заказы СТОЛ (MESA)** выделяются красной рамкой и сопровождаются тройным звуковым сигналом — обслуживайте их в приоритетном порядке.
3. **Подсказки в интерфейсе:** кнопка **«? Показать подсказки»** в верхней панели включает контекстные пояснения в каждом разделе админки.
`;

const GUIDE_MD_ES = `# 🍣 Manual del Panel de Administración — Sushi de Maksim

> **Dirección:** \`sushidemaksim.com/admin\`
> **Acceso:** exclusivo para usuarios con rol \`admin\` (Administrador) o \`superadmin\` (Owner). Los usuarios con rol \`waiter\` son redirigidos automáticamente al terminal de camarero (\`/waiter\`).

---

## Navegación

En el menú lateral se encuentran las **12 secciones** del panel:

| Sección | Función principal |
|---------|-------------------|
| **Dashboard** | Resumen de indicadores, ingresos, tiempo de entrega, TOP-10 platos e informes semanales |
| **Analítica** | LTV, margen, dispositivos, horas punta, eficacia de promos y carritos abandonados |
| **Pedidos** | Gestión de pedidos en tiempo real, impresión de tickets y contacto por WhatsApp |
| **Menú** | Platos, coste de producción, etiquetas, alérgenos y orden de categorías |
| **Clientes** | Base de usuarios, estadísticas de compra, verificación, roles y archivo |
| **Promociones** | Banners promocionales, programa de fidelidad y generador de códigos especiales |
| **Moderación Tablón** | Aprobación de publicaciones de la comunidad, categorías y sincronización con Threads |
| **Ajustes** | Interruptores de cierre para hoy, temas festivos, vacaciones, contacto y valoraciones |
| **Reservas** | Solicitudes de reserva de mesa, estados y respuesta rápida por WhatsApp |
| **Zonas de Entrega** | Mapa de zonas de reparto (polígonos y radios), tarifas y envío gratis |
| **Newsletter** | Base de suscriptores con búsqueda y exportación en CSV |
| **Manual de uso** | Guía de referencia rápida del panel de administración |

> **Insignias (badges) en el menú:** los círculos naranjas muestran la cantidad de pedidos pendientes, nuevos clientes de las últimas 24h, publicaciones pendientes en el Tablón y nuevas reservas no vistas.

---

## 🔊 Notificaciones de Sonido

El panel supervisa nuevos pedidos y reservas en tiempo real mediante Supabase Realtime:

- **Alerta individual (Fanfare):** nuevo pedido a domicilio / recogida o nueva solicitud de reserva de mesa.
- **Triple señal (Triple Chirp):** pedido prioritario realizado desde una mesa del restaurante (**MESA**).
- **Recordatorio automático:** si un pedido o reserva permanece pendiente durante más de **5 minutos**, la alerta sonora vuelve a reproducirse.

> ⚠️ Al abrir el panel por primera vez, haz clic en cualquier punto de la pantalla para que el navegador autorice el sonido. Puedes probar o silenciar las alertas desde los controles de la sección **Pedidos**.

---

## 1. Dashboard

Resumen ejecutivo del estado del restaurante en tiempo real:

- **Ingresos y tráfico:** facturación de hoy y de los últimos 30 días, visitas únicas a la web (hoy / 30 días) y tasa de conversión de clientes registrados.
- **Contadores operativos:** nuevos pedidos de hoy, pedidos pendientes de atención, clientes registrados hoy y total histórico.
- **Tiempo de entrega:** edición rápida del tiempo estimado de reparto directamente desde la cabecera.
- **TOP-10 productos del mes** y listado de **pedidos recientes**.
- **Historial de informes semanales:** tabla resumen por semana (pedidos, ingresos, ticket medio) con desglose detallado día por día al pulsar en cada semana.

---

## 2. Analítica

Centro de inteligencia de negocio (últimos 30 días):

- **Métricas clave:** LTV medio (valor de vida del cliente), ticket medio, tasa de retención (clientes recurrentes), **margen estimado y recargo** (calculados automáticamente a partir del coste de cada plato).
- **Dispositivos y audiencia:** reparto por dispositivos (móvil, escritorio, tablet), navegadores y proporción de clientes nuevos frente a recurrentes.
- **Ventas y operativa:** curva de crecimiento de ventas, rendimiento por categorías de carta y **picos de actividad por horas** para planificar turnos de cocina.
- **Marketing y carta:** impacto de campañas promocionales, interacción con los platos (vistas, favoritos ❤️, compartidos) y seguimiento de **carritos abandonados**.

---

## 3. Pedidos

> Pantalla principal de trabajo diario para la recepción y seguimiento de pedidos.

### Ciclo de vida del pedido y notificaciones Web Push

Los nombres de cada estado y los mensajes Push enviados automáticamente al cliente se adaptan según la modalidad (**Domicilio**, **Recogida**, **Mesa / MESA**):

| Etapa | Domicilio | Recogida en local | Mesa (Sala) | Notificación Push al cliente |
|-------|-----------|-------------------|-------------|------------------------------|
| **0. Pago** | Por Pagar | Por Pagar | Por Pagar | Esperando confirmación del pago online |
| **1. Creación** | Pendiente (Sistema) | Pendiente (Sistema) | Pendiente (Sistema) | Pedido registrado en el sistema |
| **2. Recibido** | Pedido recibido | Pedido recibido | Pedido recibido | *«Hemos recibido tu pedido...»* |
| **3. Confirmado** | Pedido confirmado | Pedido confirmado | Pedido confirmado | *«Tu pedido ha sido confirmado.»* |
| **4. Cocina** | Cocina (Reparto) | En cocina | Cocina (Sala) | *«Tu pedido ya está en la cocina.»* |
| **5. Listo / En camino** | En camino | Listo para recoger | Servicio en mesa | *«El repartidor ya va hacia tu dirección.»* / *«Tu pedido está listo...»* |
| **6. Completado ✅** | Pedido entregado | Pedido entregado | Pedido servido | *«¡Gracias por tu compra! Que aproveche.»* |
| **Cancelado ❌** | Cancelado | Cancelado | Cancelado | *«Tu pedido ha sido cancelado.»* |

### Automatizaciones al marcar un pedido como «Entregado»

1. **Bono cada 5º pedido:** tras completarse el 4º, 9º, 14º pedido entregado, el sistema genera y envía por email al cliente un código \`LOYALTY{X}-XXXXX\` para su siguiente compra (si está activo en Promociones → Fidelidad).
2. **Postre gratis cada 10º pedido:** tras el 9º, 19º pedido entregado, el cliente recibe por email un código \`DESSERT-XXXXX\` para un postre de regalo en su 10º pedido.
3. **Recompensa por invitación (Invita y Gana):** si el pedido utilizó un código de referido (\`REF-XXXXXXXX\`), el usuario anfitrión recibe automáticamente **5 Maksim Coins (5€)** en su saldo.

### Herramientas en cada tarjeta de pedido

- **Filtros:** \`TODO ACTIVO\`, \`Por Pagar\`, \`Cocina\`, \`En Camino\`, \`Entregados\`, \`Cancelados\`, \`Todos\` y \`Eliminados\` (pedidos archivados con opción de restaurar).
- **Ficha rápida del cliente:** al pasar el cursor sobre el nombre del cliente se muestra su historial (total de pedidos, importe invertido, ticket medio, frecuencia y plato favorito).
- **Origen y dispositivo:** indica el dispositivo, sistema operativo y navegador exacto del cliente (p. ej., \`MÓV. (IOS) • SAFARI\` o \`PC (MACOS) • CHROME\`).
- **Etiquetas de entrega:** \`PROGRAMADO\`, \`SIN LLAMADA\`, \`LLAMAR AL MÓVIL (NO TIMBRE)\`, \`MESA\`.
- **Imprimir Ticket (🖨️):** genera e imprime el recibo térmico al instante.
- **WhatsApp y Mapa:** el botón **WHATSAPP** redacta automáticamente el resumen del pedido y la dirección abre la ubicación exacta en Google Maps.

---

## 4. Menú

### Añadir y editar platos

1. Pulsa **+ Nuevo Plato**.
2. Completa los campos obligatorios: **Nombre**, **Categoría**, **Precio (€)**, **Precio de Coste (€)** (necesario para calcular márgenes en Analítica) y **Descripción**.
3. Opcionalmente indica número de piezas, peso en gramos y selecciona los **Alérgenos**.
4. Sube una imagen desde tu dispositivo (se optimiza y convierte automáticamente a formato \`WebP\`) o introduce una URL.
5. Activa las etiquetas necesarias: **Popular**, **Recomendación del Chef (CHEF)**, **Novedad**, **Picante**, **Vegetariano**, **En Promoción**.

> En la carta pública cada plato muestra además el contador de corazones ❤️ (cuántos usuarios lo han guardado en favoritos; máximo 1 favorito por usuario y plato).

### Gestión de categorías

Pulsa el botón **Categorías** para:
- Reordenar las categorías de la carta con las flechas **Subir / Bajar**.
- Añadir nuevas categorías personalizadas eligiendo nombre, identificador (\`slug\`), icono y descripción.

---

## 5. Clientes

- **Filtros:** \`Solo Activos\`, \`Solo Archivados\`, \`Todos\`.
- **Ordenación:** haz clic en cualquier cabecera de columna (ID, Nombre/Email, Pedidos, Gastado, Actividad, Reg., Rol).
- **Verificación:** muestra el estado de verificación del Email y de la fecha de cumpleaños (con opción de verificar el Email manualmente en un clic).

| Acción | Descripción |
|--------|-------------|
| **Cambiar rol** | Asignar rol: \`Owner (superadmin)\`, \`Admin (admin)\`, \`Camarero (waiter)\`, \`Moderador (moderator)\` o \`Cliente (user)\` |
| **Verificar Email** | Confirmar el correo del cliente manualmente sin necesidad de enlace por email |
| **Archivar** | Desactivación suave (oculta la cuenta conservando todos sus pedidos y estadísticas) |
| **Restaurar** | Reactivar un usuario archivado |
| **Eliminar definitivamente** | Borrado permanente e irreversible de la cuenta, pedidos, direcciones y favoritos (solo desde el archivo) |

> ⚠️ Solo el **Owner (\`superadmin\`)** puede modificar roles de usuario. No es posible cambiar ni eliminar tu propia cuenta.

---

## 6. Promociones

Dividido en 3 pestañas:

### 1. Pestaña «Promociones» (Banners y tarjetas)
- Creación de bloques promocionales en formato **Tarjeta** (en cuadrícula) o **Banner** (ancho completo con botón CTA y galería de 3–4 fotos adicionales).
- Permite reordenar las promociones arrastrándolas con el ratón (**Drag & Drop**).

### 2. Pestaña «Fidelidad»
Configuración en tiempo real de las bonificaciones automáticas:
- **Descuento por registro** (se aplica en el primer pedido; para visitantes se destaca en el regalo flotante \`DESCUENTO 10%\`).
- **Feliz Cumpleaños** (válido desde 3 días antes hasta 3 días después de la fecha de nacimiento).
- **Cada 5º pedido** (porcentaje de descuento automático en cada quinto pedido).
- **Cada 10º pedido** (regalo especial de postre gratuito).
- **Suscripción Newsletter** (descuento por suscribirse al boletín en el pie de página).

### 3. Pestaña «Códigos Promo»
- **Generador de códigos especiales:** crea al instante un código único \`SPECIAL10-XXXXXX\` del **-10%** válido durante **14 días** (ideal para atención al cliente por WhatsApp).

---

## 7. Moderación Tablón

Gestión del tablón comunitario e integración con redes:

- **Pendientes / Publicados:** aprobar, rechazar o despublicar anuncios de usuarios y contactar con el autor por WhatsApp.
- **Categorías:** aprobar nuevas categorías sugeridas por la comunidad.
- **Integración con Threads:** conectar o desconectar cuenta y pulsar **Sincronizar Threads** para importar publicaciones automáticamente.

---

## 8. Ajustes

### Interruptores operativos para hoy

| Interruptor | Efecto inmediato |
|-------------|------------------|
| **Cerrar pedidos para hoy** | Impide realizar pedidos para hoy (solo permite programar para días futuros) |
| **Solo recogida hoy** | Desactiva el servicio a domicilio hoy, permitiendo únicamente recogida en el local |
| **Cerrar reservas para hoy** | Bloquea nuevas reservas de mesa para el día actual |

### Decoración Festiva y Temas de Temporada
Al pulsar sobre cualquier tarjeta, el tema visual de la web se actualiza **al instante** (en el panel de administración las animaciones permanecen desactivadas para no distraer):
- **Automático por fechas** (Halloween hasta el 1 de noviembre, Año Nuevo en diciembre)
- **Modo Normal** (fondo clásico sin efectos especiales)
- **Año Nuevo** / **Navidad** (ambiente invernal y copos de nieve ❄️)
- **Halloween (Completo)** / **Halloween (Solo fondo)**
- El interruptor **Animaciones (murciélagos, araña, nieve)** permite mantener el fondo festivo desactivando los elementos en movimiento.

### Cierres especiales, contacto y valoraciones
- **Cierres Especiales (Vacaciones / Festivos):** define fecha de inicio, fecha de fin y motivo para bloquear pedidos en esos periodos.
- **Información general y redes:** teléfono, email, dirección física, generador automático de enlace a Google Maps y redes sociales.
- **Valoraciones externas:** puntuación visible de **TheFork**, **Google** y número total de reseñas.
- **Horario (JSON):** configuración avanzada de días y horas de apertura (pulsa **Guardar Cambios** al finalizar).

---

## 9. Reservas

Gestión de solicitudes de mesa:
- **Filtros:** \`Ver Todo\`, \`Pendientes\`, \`Confirmadas\`, \`Canceladas\`.
- **Acciones:** confirmar reserva, cancelar, revertir estado, eliminar o responder al cliente directamente con el botón **WhatsApp**.

---

## 10. Zonas de Entrega

Mapa interactivo de Madrid para configurar el reparto:
- Admite **2 tipos de zona**:
  1. **Polígono (manual):** área personalizada dibujada punto a punto sobre el mapa.
  2. **Radio (círculo):** anillo definido por un radio mínimo y máximo en kilómetros desde el restaurante.
- Para cada zona puedes ajustar: **Nombre**, **Coste de envío (€)**, **Pedido mínimo (€)**, **Gratis desde (€)**, color y opacidad.

---

## 11. Newsletter

Listado de suscriptores del boletín:
- Buscador instantáneo por dirección de correo.
- Botón **Descargar CSV** para exportar toda la lista con fechas de alta.

---

## 💡 Consejos útiles para el día a día

1. **Mantén la pestaña abierta:** los pedidos y reservas entran al instante sin recargar la página y el bloqueo de pantalla (Wake Lock) evita que el dispositivo entre en reposo.
2. **Pedidos de MESA:** aparecen destacados en rojo y emiten un triple aviso sonoro para darles prioridad en sala.
3. **Ayudas contextuales:** el botón **«? Mostrar ayudas»** en la barra superior activa explicaciones rápidas dentro de cada sección del panel.
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

    const guideMd = language === 'es' ? GUIDE_MD_ES : GUIDE_MD_RU;

    const toc = useMemo(() => extractToc(guideMd), [guideMd]);

    const html = useMemo(() => {
        const usedIds = new Map<string, number>();
        const getUniqueId = (rawText: string) => {
            const base = slugify(rawText) || 'section';
            const count = usedIds.get(base) || 0;
            usedIds.set(base, count + 1);
            return count === 0 ? base : `${base}-${count + 1}`;
        };

        // Add unique IDs to h2/h3 headings in document order for anchor scrolling
        const processed = guideMd.replace(/^(#{2,3}) (.+)$/gm, (_, hashes, text) => {
            return `${hashes} <span id="${getUniqueId(text)}">${text}</span>`;
        });

        return mdToHtml(processed);
    }, [guideMd]);

    // Highlight search in text content only (never inside HTML tags)
    const highlightedHtml = useMemo(() => {
        if (!search.trim() || search.length < 2) return html;
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return html.replace(
            new RegExp(`(${escaped})(?![^<]*>)`, 'gi'),
            '<mark class="guide-mark">$1</mark>'
        );
    }, [html, search]);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const el = contentRef.current?.querySelector(`[id="${id}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleDownload = () => {
        const blob = new Blob([guideMd], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
            language === 'es'
                ? 'manual_admin_sushidemaksim_es.md'
                : 'admin_guide_sushidemaksim_ru.md';
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
            { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
        );
        const headings = el.querySelectorAll('[id]');
        headings.forEach(h => observer.observe(h));
        return () => observer.disconnect();
    }, [html]);

    const filteredToc = useMemo(() => {
        if (!search.trim()) return toc;
        return toc.filter(item => item.text.toLowerCase().includes(search.toLowerCase()));
    }, [toc, search]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex gap-5 items-start">
                {/* Table of Contents — sticky sidebar on desktop */}
                <aside className="hidden xl:block w-60 shrink-0 sticky top-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 m-0">
                            {language === 'ru' ? 'Содержание' : 'Contenido'}
                        </p>
                        <nav className="space-y-0.5">
                            {filteredToc.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`w-full text-left flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-bold border-none cursor-pointer bg-transparent ${
                                        item.level === 3 ? 'pl-5 text-gray-400' : ''
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

                {/* Single Unified Card: Search + Download + Content */}
                <div className="flex-1 min-w-0 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 md:p-8">
                    {/* Compact Toolbar */}
                    <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-gray-100">
                        <div className="relative flex-1 min-w-0">
                            <Search
                                size={16}
                                strokeWidth={2}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={
                                    language === 'ru'
                                        ? 'Поиск по инструкции...'
                                        : 'Buscar en el manual...'
                                }
                                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold focus:border-orange-500 outline-none transition-all placeholder:text-gray-400"
                            />
                            <AnimatePresence>
                                {search && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={() => setSearch('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors p-1 bg-transparent border-none cursor-pointer"
                                    >
                                        <X size={14} strokeWidth={2} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-900 text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wider hover:bg-orange-600 transition-all active:scale-95 shrink-0 border-none cursor-pointer"
                        >
                            <Download size={14} strokeWidth={2.5} />
                            <span className="hidden sm:inline">
                                {language === 'ru' ? 'Скачать .md' : 'Descargar .md'}
                            </span>
                            <span className="sm:hidden">.MD</span>
                        </button>
                    </div>

                    {/* Main Markdown Content — Clean, Readable Typography */}
                    <div
                        ref={contentRef}
                        className="guide-content"
                        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                    />
                </div>
            </div>

            {/* Guide styles */}
            <style>{`
                .guide-content {
                    scroll-behavior: smooth;
                    color: #334155;
                }
                .guide-h1 {
                    font-size: 1.35rem;
                    font-weight: 900;
                    color: #0f172a;
                    margin: 0 0 1rem;
                    letter-spacing: -0.02em;
                    line-height: 1.3;
                }
                .guide-h2 {
                    font-size: 1.05rem;
                    font-weight: 900;
                    color: #0f172a;
                    margin: 1.75rem 0 0.75rem;
                    letter-spacing: -0.01em;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding-left: 0.75rem;
                    border-left: 3.5px solid #f97316;
                    scroll-margin-top: 5rem;
                }
                .guide-h3 {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: #475569;
                    margin: 1.25rem 0 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    scroll-margin-top: 5rem;
                }
                .guide-p {
                    font-size: 0.875rem;
                    color: #475569;
                    line-height: 1.65;
                    margin: 0.5rem 0;
                    font-weight: 500;
                }
                .guide-hr {
                    border: none;
                    border-top: 1px solid #f1f5f9;
                    margin: 1.5rem 0;
                }
                .guide-bq {
                    border-left: 3px solid #fb923c;
                    background: #fff7ed;
                    border-radius: 0 0.75rem 0.75rem 0;
                    padding: 0.65rem 0.9rem;
                    margin: 0.75rem 0;
                    font-size: 0.825rem;
                    line-height: 1.6;
                    font-weight: 600;
                    color: #7c2d12;
                }
                .guide-bold {
                    font-weight: 800;
                    color: #0f172a;
                }
                .guide-ul, .guide-ol {
                    margin: 0.6rem 0;
                    padding-left: 1.25rem;
                }
                .guide-ul {
                    list-style-type: disc;
                }
                .guide-ol {
                    list-style-type: decimal;
                }
                .guide-li {
                    font-size: 0.875rem;
                    color: #475569;
                    line-height: 1.65;
                    font-weight: 500;
                    margin-bottom: 0.35rem;
                }
                .guide-li::marker {
                    color: #f97316;
                    font-weight: 800;
                }
                .guide-link {
                    color: #ea580c;
                    font-weight: 700;
                    text-decoration: underline;
                    text-decoration-color: #fed7aa;
                }
                .guide-link:hover {
                    color: #0f172a;
                }
                .guide-table-wrap {
                    overflow-x: auto;
                    margin: 0.85rem 0;
                    border: 1px solid #f1f5f9;
                    border-radius: 0.85rem;
                }
                .guide-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.825rem;
                }
                .guide-th {
                    background: #f8fafc;
                    font-weight: 800;
                    color: #64748b;
                    padding: 0.65rem 0.85rem;
                    text-align: left;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid #e2e8f0;
                    white-space: nowrap;
                }
                .guide-td {
                    padding: 0.65rem 0.85rem;
                    border-bottom: 1px solid #f1f5f9;
                    color: #475569;
                    font-weight: 500;
                    font-size: 0.825rem;
                    line-height: 1.5;
                    vertical-align: top;
                }
                .guide-tr:last-child .guide-td {
                    border-bottom: none;
                }
                .guide-td:first-child {
                    font-weight: 800;
                    color: #0f172a;
                    white-space: nowrap;
                }
                .guide-pre {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.85rem;
                    padding: 0.85rem 1rem;
                    margin: 0.85rem 0;
                    overflow-x: auto;
                }
                .guide-code {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 0.78rem;
                    color: #1e293b;
                    line-height: 1.65;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                .guide-inline-code {
                    background: #fff7ed;
                    border: 1px solid #ffedd5;
                    color: #c2410c;
                    padding: 0.1rem 0.4rem;
                    border-radius: 0.375rem;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 0.82em;
                    font-weight: 700;
                }
                .guide-mark {
                    background: #fef08a;
                    color: #0f172a;
                    border-radius: 0.25rem;
                    padding: 0 0.2rem;
                }
            `}</style>
        </div>
    );
}
