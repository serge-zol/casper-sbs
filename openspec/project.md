# Каспер. Крок за кроком. — OpenSpec Project Context
> Прочитай цей файл перед будь-яким завданням. Він є єдиним джерелом правди про проект.

---

## Що це за продукт

**Каспер** — Mobile-first PWA-щоденник активності для пари (Серж і Олена), який допомагає поступово повернутись до регулярного руху через ходьбу. Фіксує активність, запитує самопочуття (pre/post-check) і дає щоденну рекомендацію на основі rule-based логіки.

- **Слоган:** Не рекорд. Ритм, що тримає.
- **Статус:** MVP v0.1 — в розробці (Фаза 3)
- **Деплой:** Vercel / Netlify / Cloudflare Pages (статична збірка + HTTPS)

---

## ⛔ ТРИ ЗАБОРОНИ — порушення неприпустиме

```
1. Додаток НЕ є медичним консультантом — жодних діагнозів, жодних «ми вилікуємо»
2. Медичні обмеження Олени зчитуються ПЕРШИМИ — до будь-якої рекомендації
3. Червоний прапорець (біль, задишка) = зупинка активності. Ніякої мотивації «дотиснути»
```

---

## Технічний стек

| Шар | Технологія |
|-----|-----------|
| Frontend | React 19 + Vite 8 · TypeScript 6 (обов'язково) |
| Стилі | Tailwind CSS 4 · кастомні токени через `@theme {}` в CSS (нижче) |
| Сховище | IndexedDB через Dexie.js · localStorage для appState |
| PWA | vite-plugin-pwa · Workbox service worker |
| AI-логіка | Rule-based TypeScript функції · БЕЗ зовнішніх AI API у v0.1 |
| Графіки | Recharts (мінімальний bundle) |

### Ініціалізація (виконано)
```bash
# Виконано 2026-05-20. React 19 · Vite 8 · TS 6 · Tailwind 4
npm create vite@latest . -- --template react-ts
npm install dexie dexie-react-hooks lucide-react recharts workbox-window
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
```

---

## Структура папок

```
kasper/
├── public/
│   └── icons/              # 192.png · 512.png · apple-touch-icon.png
├── src/
│   ├── components/
│   │   ├── ui/             # Button · Card · Slider · EmojiPicker · TabBar
│   │   ├── screens/        # Welcome · ProfileSelect · Home · Activity · Journal · Statistics · Settings
│   │   └── layout/         # TabBar.tsx · SafeAreaWrapper.tsx
│   ├── db/
│   │   ├── db.ts           # Dexie ініціалізація
│   │   └── types.ts        # TypeScript інтерфейси
│   ├── logic/
│   │   ├── recommendation.ts   # generateRecommendation() — rule-based
│   │   ├── safetyCheck.ts      # checkRedFlags()
│   │   ├── streak.ts           # calcStreak()
│   │   └── kasperPhrases.ts    # Словник фраз
│   ├── hooks/
│   │   ├── useActiveProfile.ts
│   │   ├── useRecommendation.ts
│   │   └── useWeekStats.ts
│   ├── utils/date.ts
│   ├── App.tsx             # Роутинг
│   └── index.css
└── vite.config.ts          # + vite-plugin-pwa
```

---

## Дизайн-токени (Tailwind v4)

> Tailwind v4: немає `tailwind.config.js`. Токени оголошуються в `src/index.css` через `@theme {}`.

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-kasper-orange:     #E85B16; /* лапка · CTA · головний акцент */
  --color-kasper-amber:      #F39A2F; /* прогрес · теплі підсвітки */
  --color-kasper-cream:      #FFF7EC; /* фон сторінок */
  --color-kasper-sand:       #FCE7D2; /* картки · розділювачі */
  --color-kasper-green:      #CDE1D5; /* відновлення · wellness */
  --color-kasper-dark-green: #053E35; /* заголовки · футер · PWA theme_color */
  --color-kasper-graphite:   #1F2A2E; /* основний текст */
}
```

Використання в класах: `bg-kasper-cream`, `text-kasper-orange`, `border-kasper-sand` тощо.

### Естетика бренда
- **Стиль:** реалістичний теплий спортивно-затишний (НЕ gym-hardcore)
- **Мотиви:** 🐾 лапка · 👣 котячі сліди · 🐈 рудий кіт · 🛤 стежка · 🔊 муркотіння
- **Уникати:** сором · тиск · агресивна мотивація · "до/після" фото · дитячий мультяшний стиль

### Tone of voice
```
✅ "Каспер поруч. Йдемо спокійно, без ривків."
✅ "Пропуск — не провал. Просто повертаємось до маршруту."
✅ "Сьогодні не треба рекорду. Достатньо повернути ритм."
✅ "Крок маленький сьогодні — результат упевнений завтра."
```

---

## Профілі та режими

| Профіль | Ціль | Логіка |
|---------|------|--------|
| **Серж** | Повернення у форму · перехід до бігу | Поступово додавати час і темп якщо стабільно |
| **Олена** | Відновлення після операції на м'язах | БЕЗ форсування. Пріоритет — комфорт і відсутність болю |
| **Разом** | Спільна звичка і мотивація | Один маршрут · дві персональні рекомендації · окремі підсумки |

---

## Структура даних (TypeScript)

### Profile
```ts
interface Profile {
  id?: number;
  name: string;
  mode: 'serge' | 'olena' | 'custom';
  ageGroup: '20-30' | '31-40' | '41-50' | '51-60' | '60+';
  gender?: 'male' | 'female' | 'other';
  activityLevel: 1 | 2 | 3 | 4;
  goals: string[];
  schedule: {
    daysPerWeek: '1-2' | '3-4' | '5+' | 'flexible';
    timeOfDay: 'morning' | 'day' | 'evening' | 'flexible';
    targetMinutes: number;
  };
  medical: {
    inRecovery: boolean;
    restrictions: string[];        // 'surgery'|'heart'|'joints'|'pain'|'pregnancy'
    eventDate?: string;            // ISO date — дата операції/травми
    prohibitions: string;          // free text: 'не бігти, пульс <120'
    restrictionUntil?: string;     // ISO date | 'doctor' | 'permanent'
    doctorNotes?: string;
  };
  partner?: number;                // profileId партнера
  createdAt: string;
  updatedAt: string;
}
```

### Activity
```ts
interface Activity {
  id?: number;
  profileId: number;
  partnerProfileId?: number;
  mode: 'solo' | 'together';
  date: string;
  startTime?: string;
  duration: number;              // хвилини
  distance?: number;             // км
  steps?: number;
  pace?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  notes?: string;
  isRestDay: boolean;
  restDayType?: 'auto' | 'manual' | 'planned';
  safetyLevel: 'green' | 'yellow' | 'red';
}
```

### CheckIn
```ts
interface CheckIn {
  id?: number;
  activityId: number;
  profileId: number;
  type: 'before' | 'after';
  date: string;
  // before
  sleep?: 1|2|3|4|5;
  fatigue?: 1|2|3|4|5;
  pain: boolean;
  painDetails?: string;
  painZone?: string;
  readiness?: 1|2|3|4|5;
  mood?: 1|2|3|4|5;
  conditions?: 'outdoor' | 'indoor' | 'gym';
  operationZoneDiscomfort?: boolean;  // ⚠️ ТІЛЬКИ ДЛЯ ОЛЕНИ
  // after
  difficulty?: 1|2|3|4|5|6|7|8|9|10;
  fatigueAfter?: 1|2|3|4|5;
  discomfortAfter?: boolean;
  discomfortDetails?: string;
  feeling?: 'better' | 'same' | 'worse';
  nextTimeChange?: string;
  notesAfter?: string;
  redFlags: string[];
}
```

### Recommendation
```ts
interface Recommendation {
  id?: number;
  profileId: number;
  date: string;
  targetDuration: number;
  paceType: 'comfortable' | 'normal' | 'with-acceleration' | 'rest';
  cautionLevel: 'green' | 'yellow' | 'red';
  reason: string;             // 1 речення для UI
  safetyNotes?: string;       // примітка для Олени
  nextStep?: string;
  kasperPhrase: string;
}
```

### SafetyFlag
```ts
interface SafetyFlag {
  id?: number;
  profileId: number;
  date: string;
  level: 'yellow' | 'red';
  symptom: string;
  source: 'before-checkin' | 'after-checkin' | 'manual';
  action: string;
  resolved: boolean;
  resolvedAt?: string;
}
```

### Dexie ініціалізація
```ts
db.version(1).stores({
  profiles:        '++id, name, mode',
  activities:      '++id, profileId, date, mode',
  checkins:        '++id, activityId, profileId, type, date',
  recommendations: '++id, profileId, date',
  safetyFlags:     '++id, profileId, date, level',
  weeklySummaries: '++id, profileId, weekId',
  appState:        'key',
});
```

---

## Логіка рекомендацій — rule-based (БЕЗ ML)

### Порядок обчислення (ЗАВЖДИ в цьому порядку)
1. **SAFETY** — зчитати `medical.prohibitions`, `inRecovery`, `restrictions` з профілю
2. **RED FLAGS** — перевірити останній CheckIn. `redFlags.length > 0` → `cautionLevel=red`, `paceType=rest`
3. **PRE-CHECK** — `sleep`, `fatigue`, `readiness`, `pain`, `operationZoneDiscomfort`
4. **HISTORY** — останні 7 активностей: avg difficulty, streak, тенденція
5. **DURATION** — базова з профілю, скоригована на стан
6. **PACE TYPE** — comfortable / normal / with-acceleration
7. **PHRASE** — вибрати з словника за cautionLevel
8. **RETURN** Recommendation

### Псевдокод generateRecommendation
```ts
function generateRecommendation(profile, preCheck, history): Recommendation {
  // 1. Safety gate — медичні обмеження мають найвищий пріоритет
  const noRun = profile.medical.prohibitions.toLowerCase().includes('не бігти');
  // якщо noRun — paceType НІКОЛИ не буде 'with-acceleration'

  // 2. Red flags
  const lastAfter = getLastCheckin(profile.id, 'after');
  if (lastAfter?.redFlags?.length > 0) {
    return makeSafeRec('Є тривожні симптоми. Сьогодні відпочиваємо.', 'red');
  }

  // 3. State score (0–100)
  const score = (preCheck.sleep ?? 3) * 10
              + (preCheck.readiness ?? 3) * 10
              + (5 - (preCheck.fatigue ?? 3)) * 10
              + (preCheck.pain ? -25 : 0)
              + (preCheck.operationZoneDiscomfort ? -30 : 0);

  // 4. History
  const avgDiff = avg(history.slice(-7).map(a => a.lastDifficulty ?? 5));
  const streak  = calcStreak(history);

  // 5–6. Duration + pace
  let duration = profile.schedule.targetMinutes ?? 20;
  if (score < 40) duration = Math.round(duration * 0.6);
  else if (score < 65) duration = Math.round(duration * 0.8);
  if (avgDiff >= 8) duration = Math.round(duration * 0.7);

  let pace = 'comfortable';
  if (!noRun && score >= 75 && avgDiff <= 5 && streak >= 3 && profile.mode !== 'olena') {
    pace = 'normal';
  }
  if (!noRun && profile.mode === 'serge' && score >= 85 && avgDiff <= 4 && streak >= 5) {
    pace = 'with-acceleration';
  }

  const caution = score < 40 ? 'red' : score < 65 ? 'yellow' : 'green';
  return { targetDuration: duration, paceType: pace, cautionLevel: caution,
           reason: buildReason(score, avgDiff, streak),
           kasperPhrase: pickPhrase(caution) };
}
```

### Жорсткі правила прогресу Олени
```
✅ Умова переходу: 5+ активностей БЕЗ redFlags / operationZoneDiscomfort / feeling='worse'
⛔ НІКОЛИ paceType='with-acceleration' якщо profile.mode='olena'
⛔ Не підвищувати duration якщо в last after-checkin: discomfortAfter=true або feeling='worse'
⛔ Максимальний крок збільшення: +5 хвилин від попереднього значення
⚠️ operationZoneDiscomfort — ПЕРШЕ питання у pre-check для Олени
```

---

## Правила безпеки (обов'язкові)

### Червоні прапорці → зупинка
| Симптом | Дія системи |
|---------|------------|
| Біль у грудях / різкий дискомфорт | `cautionLevel='red'` · Зупинити · Показати попередження |
| Задишка / запаморочення / слабкість | `cautionLevel='red'` · `targetDuration=0` · Зберегти SafetyFlag |
| Сильний біль у зоні операції (Олена) | `cautionLevel='red'` · Навантаження=0 · Порадити лікаря |
| Погане відновлення наступного дня | `cautionLevel='yellow'` · Не підвищувати duration |
| Симптом позначений як тривожний | `cautionLevel='red'` завжди |

### Обов'язковий текст безпеки (в Налаштуваннях)
> "Цей застосунок не є медичною консультацією. Якщо є гострий біль, різке погіршення стану або лікарські обмеження — тренування треба узгоджувати з лікарем або реабілітологом."

### Приватність медичних даних
- Медичні дані Олени **НЕ видно Сержу** ніде в UI (виняток: лише статус «режим відновлення»)
- v0.1 — виключно локальне зберігання. Жодної передачі на сервер
- Кнопка «Видалити всі дані» в налаштуваннях — з підтвердженням, чистить IndexedDB

### AI може ✅ / не має права ⛔
```
✅ Пояснювати чому саме така рекомендація
✅ Пропонувати легший варіант якщо втома висока
✅ Пропонувати день відновлення якщо 3+ важких дні поспіль
✅ Pracювати з маленькими кроками: 5–10 хв краще ніж нуль

⛔ Ставити діагнози або замінювати лікаря
⛔ Мотивувати через сором або тиск
⛔ Автоматично переводити Олену на прискорення або біг
⛔ Обіцяти схуднення, лікування або рекорди
⛔ Ігнорувати medical.prohibitions при розрахунку
```

---

## Мобільний UI — обов'язкові правила

```
Touch target:    ≥ 44px для всіх інтерактивних елементів
Input font-size: ≥ 16px (уникати zoom на iOS)
Safe area:       env(safe-area-inset-bottom) для tab-bar та content
Tab-bar:         position: fixed, bottom: 0, height: calc(56px + env(safe-area-inset-bottom))
Page content:    padding-bottom: calc(56px + env(safe-area-inset-bottom) + 16px)
Keyboard:        visualViewport API для коректного layout
iOS Safari:      -webkit-touch-callout: none на зображеннях
Android back:    history.back()
Анімації:        CSS transitions (opacity, transform), prefers-reduced-motion підтримується
Bundle:          < 200 KB gzip, code splitting по маршрутах
LCP:             < 2.5s на емульованому 3G
```

### Фіксована палітра (dark mode — v0.2+)
У v0.1 — тільки світла тема. Не використовувати `prefers-color-scheme` в логіці кольорів.

---

## PWA — обов'язкові вимоги

```json
// manifest.json
{
  "name": "Каспер. Крок за кроком.",
  "short_name": "Каспер",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFF7EC",
  "theme_color": "#053E35",
  "lang": "uk",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- Service worker: cache-first для статики, network-first для IndexedDB
- Offline-режим: Журнал, рекомендація, статистика — працюють без інтернету
- Install prompt: `beforeinstallprompt` — кастомний банер після 2-го відвідування
- iOS meta: `apple-touch-icon 180px`, `apple-mobile-web-app-capable=yes`

---

## Порядок реалізації (суворий)

```
Крок 1: db.ts + types.ts → App.tsx роутинг → TabBar → BaseUI
Крок 2: Welcome (7 кроків онбордингу) → ProfileSelect → збереження Profile
Крок 3: recommendation.ts → safetyCheck.ts → streak.ts → kasperPhrases.ts (+ unit-тести AC-12,13,17)
Крок 4: Home (дашборд) → useRecommendation → useWeekStats
Крок 5: Activity (PreCheck → Таймер → PostCheck → Висновок)
Крок 6: Journal (список · фільтр · деталі · порожній стан)
Крок 7: Statistics (Серж / Олена / Разом · Recharts)
Крок 8: Settings (профіль · здоров'я · розклад · система · текст безпеки)
Крок 9: PWA audit · іконки · offline fallback · деплой → Lighthouse ≥ 90
```

---

## Що НЕ будувати в v0.1

```
⛔ Backend, сервер, будь-який API
⛔ Авторизація (Google Sign-In, email/password)
⛔ Garmin API (тільки ручне введення даних)
⛔ ML / LLM API для рекомендацій
⛔ Бігові плани або інтервали (тільки ходьба)
⛔ Соцмережі, sharing, leaderboard
⛔ ІМТ, VO2max, пульсові зони
⛔ Платежі, підписки, paywall
⛔ Dark mode (v0.2+)
```

---

## Приймальні критерії (18 AC)

| # | Критерій | Перевірка |
|---|----------|-----------|
| AC-01 | Lighthouse PWA ≥ 90 | Chrome DevTools → Lighthouse |
| AC-02 | Встановлюється на Android Chrome | Додати на головний екран |
| AC-03 | Встановлюється на iOS Safari | Share → На головний екран |
| AC-04 | Offline після 1-го завантаження | DevTools → Network → Offline |
| AC-05 | LCP < 2.5s на 3G | Lighthouse → Performance |
| AC-06 | Touch target ≥ 44px скрізь | DevTools Accessibility |
| AC-07 | Input font-size ≥ 16px | Відкрити форму на iPhone — немає zoom |
| AC-08 | Safe-area коректно (notch) | iPhone X+ або симулятор |
| AC-09 | Tab-bar не перекриває контент при клавіатурі | Відкрити поле → CTA видимий |
| AC-10 | Плавний скрол 20+ записів у Журналі | Реальний пристрій |
| AC-11 | Онбординг зберігає Profile в IndexedDB | DevTools → Application → IndexedDB |
| **AC-12** | **Медичні обмеження зчитуються до рекомендації** | **'не бігти' → без прискорення** |
| **AC-13** | **Червоний прапорець = paceType='rest'** | **Pre-check: біль у грудях → rest** |
| AC-14 | Медичні дані Олени невидимі Сержу | Перевірити всі спільні екрани |
| AC-15 | Activity + CheckIn зберігаються та відображаються | Завершити → знайти в Журналі |
| AC-16 | Статистика фільтрується Серж / Олена / Разом | Перевірити всі 3 вкладки |
| **AC-17** | **Олена НІКОЛИ не отримує 'with-acceleration'** | **10 ідеальних сесій → перевірити** |
| AC-18 | Streak розраховується коректно | 3 дні → streak=3 · Пропуск → streak=0 |

---

## Дорожня карта версій

| Версія | Зміст |
|--------|-------|
| **v0.1** ← зараз | PWA-каркас · два профілі · режим "Разом" · ручний журнал · дашборд · червоні прапорці |
| v0.2 | Кращий дашборд · графіки · м'які нагадування |
| v0.3 | AI-рекомендації на базі історії та самопочуття |
| v0.4 | Google Sign-In · синхронізація · резервне копіювання |
| v0.5+ | Garmin / Health Connect · експорт · перехід до бігу |

---

## Словник фраз (kasperPhrases.ts)

```ts
export const phrases: Record<'green' | 'yellow' | 'red', string[]> = {
  green: [
    'Тіло готове. Виходимо в ритм.',
    'Каспер поруч. Йдемо спокійно, без ривків.',
    'Добрий стан — добрий крок сьогодні.',
  ],
  yellow: [
    'Сьогодні не треба рекорду. Достатньо повернути ритм.',
    'Тримай ритм. Не тисни на себе.',
    'Невелика втома — це нормально. Крок маленький теж рахується.',
  ],
  red: [
    'Сьогодні краще відпочити. Пауза — це теж частина прогресу.',
    'Пропуск — не провал. Просто повертаємось до маршруту завтра.',
  ],
};
```

---

*Каспер. Крок за кроком. · OpenSpec project.md · v0.1 · Травень 2026*
