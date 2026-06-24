# 🗺️ Инструкция по миграции на новый Vercel, Supabase и настройке Cloudflare

В этом руководстве собраны подробные инструкции по переносу проекта на новые платформы и подключению Cloudflare.

---

## Шаг 1. Экспорт и импорт базы данных Supabase

Если у вас установлен **Supabase CLI** или **Postgres (pg_dump)**, вы можете легко экспортировать схему и данные из терминала.

### Вариант А: Использование pg_dump (Рекомендуется)

1. **Экспортируйте схему базы данных** (только структуру публичной схемы, без лишних системных таблиц):
    ```bash
    pg_dump -h db.dvsmzciknlfevgxpnefr.supabase.co -U postgres -d postgres --schema-only -N auth -N storage -F p -f sushidemaksim_schema.sql
    ```
2. **Экспортируйте данные**:
    ```bash
    pg_dump -h db.dvsmzciknlfevgxpnefr.supabase.co -U postgres -d postgres --data-only -N auth -N storage -F p -f sushidemaksim_data.sql
    ```
3. **Импортируйте в новую базу данных** (через консоль или GUI вроде pgAdmin/DBeaver):
   Примените сначала `sushidemaksim_schema.sql`, затем `sushidemaksim_data.sql` к вашей новой базе данных Supabase.

---

### Вариант B: Ручной перенос через SQL Editor

Если терминала под рукой нет, вы можете получить схему таблиц из консоли Supabase. Но так как в Supabase также настроены права доступа (Row Level Security и Grants), после создания таблиц на новом проекте **обязательно выполните этот SQL-скрипт** в **SQL Editor** нового Supabase:

```sql
-- 1. Выдача необходимых прав для Data API (Важно после обновлений безопасности Supabase 2026 года)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- 2. Разрешение использования последовательностей (секвенций) для автоматической генерации ID
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO service_role;
```

> [!WARNING]
> **Перенос пользователей (Auth):**
> Для переноса аккаунтов клиентов зайдите в старую панель Supabase -> **Authentication** -> **Users** -> нажмите **Export Users** (экспорт в CSV). В новом проекте импортируйте этот список через интерфейс.

---

## Шаг 2. Настройка нового проекта в Vercel

1. Создайте проект в новом аккаунте Vercel и подключите ваш репозиторий GitHub.
2. В процессе настройки добавьте следующие **Environment Variables** (Переменные окружения):

| Имя переменной           | Откуда взять значение / Пример                                 |
| :----------------------- | :------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Новый Supabase -> Settings -> API -> Project URL               |
| `SUPABASE_URL`           | То же, что и `VITE_SUPABASE_URL`                               |
| `VITE_SUPABASE_ANON_KEY` | Новый Supabase -> Settings -> API -> `anon` public key         |
| `SUPABASE_KEY`           | Новый Supabase -> Settings -> API -> `service_role` secret key |
| `VITE_FRONTEND_URL`      | `https://www.sushidemaksim.com`                                |
| `FRONTEND_URL`           | `https://www.sushidemaksim.com`                                |
| `VITE_SITE_URL`          | `https://www.sushidemaksim.com`                                |
| `JWT_SECRET`             | Случайная длинная строка (например, 32+ символа)               |
| `SMTP_HOST`              | `smtp.gmail.com`                                               |
| `SMTP_PORT`              | `587`                                                          |
| `SMTP_USER`              | Ваша почта Gmail (например, `19fire43@gmail.com`)              |
| `SMTP_PASS`              | Пароль приложения Gmail (App Password, 16 символов)            |
| `SMTP_FROM_NAME`         | `Sushi de Maksim`                                              |
| `RESEND_API_KEY`         | API-ключ вашего аккаунта Resend (если используется)            |
| `ADMIN_EMAIL`            | `19fire43@gmail.com,maksimsushimadrid@gmail.com`               |
| `VITE_GOOGLE_CLIENT_ID`  | ID клиента Google OAuth (полученный в Google Cloud Console)    |
| `RECAPTCHA_SECRET_KEY`   | Секретный ключ Google reCAPTCHA v2 / v3                        |

---

## Шаг 3. Делегирование DNS и настройка Cloudflare

### 1. Подключение домена

1. Зарегистрируйтесь на [Cloudflare](https://www.cloudflare.com/) и добавьте ваш домен `sushidemaksim.com`.
2. Скопируйте предоставленные Cloudflare NS-серверы (например, `xxx.ns.cloudflare.com`).
3. Зайдите в панель регистратора вашего домена и обновите DNS-серверы (NS-записи), заменив старые на новые серверы Cloudflare.

### 2. Настройка SSL/TLS (Важнейший шаг)

- В панели Cloudflare перейдите в раздел **SSL/TLS** -> **Overview**.
- Измените режим шифрования на **Full** или **Full (strict)**.
- _Если оставить режим Flexible, сайт уйдет в циклическую переадресацию (Error 310)._

### 3. DNS-записи в Cloudflare для Vercel

В разделе **DNS** -> **Records** добавьте две записи:

1. **Тип**: `A`, **Имя**: `@` (или `sushidemaksim.com`), **Target**: `76.76.21.21`, **Proxy status**: `Proxied` (Оранжевое облако).
2. **Тип**: `CNAME`, **Имя**: `www`, **Target**: `cname.vercel-dns.com`, **Proxy status**: `Proxied` (Оранжевое облако).

### 4. Создание правил Cache Rules

Для сниженияEdge-запросов к Vercel перейдите в **Caching** -> **Cache Rules** и добавьте два правила:

#### Правило №1: Кэширование статических ресурсов

- **Имя**: `Cache Static Assets`
- **Условие (If...)**:
    - Поле: `URI Path` -> Оператор: `starts with` -> Значение: `/assets/`
    - _ИЛИ_ Поле: `URI Path` -> Оператор: `starts with` -> Значение: `/sounds/`
- **Действие (Then...)**:
    - Cache eligibility: **Eligible for cache**
    - Edge Cache TTL: **Respect origin headers** или **Override to 1 month**

#### Правило №2: Обход кэша для API (Динамические данные)

- **Имя**: `Bypass API Cache`
- **Условие (If...)**:
    - Поле: `URI Path` -> Оператор: `starts with` -> Значение: `/api/`
- **Действие (Then...)**:
    - Cache eligibility: **Bypass cache** (это гарантирует актуальность заказов и статусов).

---

## Шаг 4. Настройка секретов в GitHub (для CI/CD)

Если у вас настроены автоматические тесты (GitHub Actions), запуск Playwright тестов (E2E) завершится ошибкой, пока вы не добавите секреты в ваш новый репозиторий GitHub.

1. Перейдите в ваш репозиторий на GitHub: `https://github.com/maksimsushimadrid/sushidemaksim`.
2. Зайдите в **Settings** (Настройки репозитория) -> **Secrets and variables** -> **Actions**.
3. Нажмите **New repository secret** и добавьте следующие переменные:

| Имя секрета    | Описание / Где взять значение                                         |
| :------------- | :-------------------------------------------------------------------- |
| `SUPABASE_URL` | Адрес нового Supabase (Settings -> API -> Project URL)                |
| `SUPABASE_KEY` | Секретный ключ `service_role` (Settings -> API -> `service_role` key) |
| `JWT_SECRET`   | Тот же `JWT_SECRET`, который вы указали в Vercel                      |

4. После добавления секретов перейдите во вкладку **Actions**, откройте последний упавший запуск и нажмите **Re-run all jobs** (или отправьте новый коммит). Тесты пройдут успешно.
