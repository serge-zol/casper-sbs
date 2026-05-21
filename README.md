# Каспер. Крок за кроком.

> AI-супутник для поступового повернення у форму · PWA v0.1

Mobile-first PWA-щоденник активності для пари (Серж і Олена). Фіксує ходьбу, запитує самопочуття до/після, дає щоденну rule-based рекомендацію з урахуванням медичних обмежень.

**Слоган:** Не рекорд. Ритм, що тримає.

---

## Стек

| Шар | Технологія |
|-----|-----------|
| Frontend | React 19 + Vite 8 + TypeScript 6 |
| Стилі | Tailwind CSS 4 (через `@theme {}` в CSS) |
| Сховище | IndexedDB через Dexie 4 |
| PWA | vite-plugin-pwa + Workbox |
| Графіки | Recharts (lazy chunk) |
| Тести | Vitest |

---

## Команди

```bash
npm install        # встановити залежності
npm run dev        # dev-сервер
npm run build      # production-білд → dist/
npm run preview    # preview production-білду
npm test           # запустити unit-тести
npm run lint       # ESLint
```

---

## Структура

```
casper-sbs/
├── openspec/project.md    Єдине джерело правди
├── docs/                  brand · concept · mvp-screens · tz-developer
├── public/                PWA-іконки (згенеровано з casper-icon.svg)
├── src/
│   ├── App.tsx            Роутинг (state-based, lazy для Statistics)
│   ├── db/                Dexie + типи
│   ├── logic/             Rule-based AI (recommendation, safety, streak, phrases)
│   ├── components/
│   │   ├── ui/            Button
│   │   ├── layout/        TabBar, SafeAreaWrapper
│   │   └── screens/       Onboarding, ProfileSelect, Home, Activity, Journal, Statistics, Settings
│   └── hooks/             useActiveProfile, useRecommendation, useWeekStats
└── vite.config.ts         PWA + Tailwind + path alias @
```

---

## ⛔ Три правила, що не можна порушити

1. Додаток **не є** медичним консультантом. Жодних діагнозів.
2. Медичні обмеження Олени читаються **ПЕРШИМИ** — до будь-якої рекомендації.
3. Червоний прапорець (біль, задишка) = зупинка. Без мотивації «дотиснути».

Перевіряється у `src/logic/recommendation.ts` + покрито unit-тестами (`npm test`).

---

## Деплой

Будь-який static host (Vercel / Netlify / Cloudflare Pages). HTTPS обов'язковий для PWA.

### Vercel
```bash
npx vercel deploy
```
Налаштувань не потребує. `dist/` — output, `npm run build` — build command.

### Netlify
```bash
npx netlify deploy --build --prod
```
або через UI: build = `npm run build`, publish = `dist`.

### Cloudflare Pages
```bash
npx wrangler pages deploy dist
```

---

## Перевірка PWA (Lighthouse)

1. `npm run build && npm run preview`
2. Chrome → DevTools → Lighthouse → Mobile → Categories: Performance, PWA
3. Цілі: PWA ≥ 90, LCP < 2.5s

**Installable:**
- Android Chrome → Add to Home Screen
- iOS Safari → Share → Додати на головний екран

---

## Перегенерація іконок

```bash
npx pwa-assets-generator
```
Бере `public/casper-icon.svg` і створює всі PWA/iOS PNG-розміри.

---

## Дорожня карта

| Версія | Що додається |
|--------|-------------|
| **v0.1** | ✅ Поточна — PWA-каркас, два профілі, режим «Разом», ручний журнал, дашборд, червоні прапорці |
| v0.2 | Кращий дашборд, графіки, м'які push-нагадування, тижневий підсумок |
| v0.3 | AI-рекомендації на повній історії, Google Sign-In, синхронізація |
| v0.4 | Garmin: ручний → імпорт → Health API |
| v1.0 | Ходьба + легкий біг, повна аналітика відновлення Олени |

---

*Каспер. Крок за кроком. · v0.1 MVP · Травень 2026*
