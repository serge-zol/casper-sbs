# Каспер. Крок за кроком. — ТЗ для AI-розробника
> PWA v0.1 · Mobile-first · Rule-based AI · Локальне сховище · Травень 2026
> Для розробника, що використовує Cursor / Copilot / Claude Code. **Всі функції, обмеження і заборони описані явно.**

---

## ⛔ Три правила, які не можна порушити

```
1. Додаток НЕ є медичним консультантом. Жодних діагнозів, жодних «ми вилікуємо».
2. Медичні обмеження Олени зчитуються ПЕРШИМИ — до будь-якої рекомендації.
3. Червоний прапорець (біль, задишка) = зупинка. Ніякої мотивації «дотиснути».
```

---

## 1. Суть продукту

Каспер — PWA-додаток для пари. Допомагає повертатись до регулярного руху через ходьбу: фіксує активність, запитує самопочуття і дає щоденну рекомендацію.

| Профіль | Ціль | Логіка |
|---------|------|--------|
| **Серж** | Повернення у форму, перехід до бігу | Поступово додавати час і темп якщо стабільно |
| **Олена** | Відновлення після операції на м'язах | БЕЗ форсування. Пріоритет — комфорт і відсутність болю |
| **Разом** | Спільна звичка і мотивація | Один маршрут, дві персональні рекомендації, окремі підсумки |

---

## 2. Технічний стек і PWA-вимоги

### Стек

| Шар | Технологія |
|-----|-----------|
| Frontend | React 18 + Vite · TypeScript — обов'язково |
| Стилі | Tailwind CSS v4 (конфіг через `@theme {}` в CSS, не tailwind.config.js) |
| Сховище | IndexedDB через Dexie.js · localStorage для appState |
| PWA | vite-plugin-pwa · Workbox service worker |
| AI-логіка | Rule-based TypeScript функції. БЕЗ зовнішніх AI API у v0.1. |
| Графіки | Recharts (мінімальний bundle) |
| Деплой | Vercel / Netlify / Cloudflare Pages. Статична збірка + HTTPS. |

### Реальні версії (після init)
```
react: 19.x
typescript: 6.0
vite: 8.x
tailwindcss: 4.x
dexie: 4.x
```

### Ініціалізація
```bash
npm create vite@latest . -- --template react-ts
npm install dexie dexie-react-hooks lucide-react recharts
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npm install workbox-window
```

### Tailwind v4 — кольорові токени в CSS
```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-casper-orange: #E85B16;    /* CTA, лапка, акценти */
  --color-casper-amber: #F39A2F;     /* прогрес, підсвітки */
  --color-casper-cream: #FFF7EC;     /* фон сторінок */
  --color-casper-sand: #FCE7D2;      /* картки, підкладки */
  --color-casper-green: #CDE1D5;     /* відновлення, wellness */
  --color-casper-dark-green: #053E35; /* заголовки, шапки */
  --color-casper-graphite: #1F2A2E;  /* основний текст */
}
```

### Обов'язкові PWA-вимоги

```json
// public/manifest.json
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
- Offline: Журнал, рекомендація, статистика — працюють без інтернету
- Install prompt: `beforeinstallprompt` — кастомний банер після 2-го відвідування
- iOS meta: `apple-touch-icon 180px`, `apple-mobile-web-app-capable=yes`

---

## 3. Адаптація для смартфона (Mobile-first)

### Viewport і базові налаштування
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

| Правило | Значення |
|---------|---------|
| Safe area iOS | `env(safe-area-inset-bottom)` для таб-бару та CTA |
| Висота | `100dvh` замість `100vh` |
| Шрифт body | ≥ 16px мінімум |
| Поля вводу | Суворо ≥ 16px (без auto-zoom в iOS Safari) |

### Таб-бар — CSS

```css
.tab-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: calc(56px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: #FFFFFF;
  border-top: 1px solid #E8E8E8;
  z-index: 100;
}

.page-content {
  padding-bottom: calc(56px + env(safe-area-inset-bottom) + 16px);
}
```

### Touch і жести

| Правило | Значення |
|---------|---------|
| Мін. tap target | 44×44 px — всі кнопки, чекбокси, іконки |
| Слайдери | Thumb ≥ 28px, трек ≥ 6px |
| Скрол | `overscroll-behavior: none` на головних екранах |
| Hover | Не покладатись на hover. Тільки touch / focus / active. |

### Поля вводу

| Правило | Значення |
|---------|---------|
| Font-size | ≥ 16px — запобігає auto-zoom в iOS Safari |
| Числа | `inputmode="numeric"` |
| Клавіатура | `enterKeyHint="done"/"next"` |
| Emoji picker | Нативний через Unicode в `<button>`. Без бібліотек. |

### Продуктивність

| Метрика | Ціль |
|---------|------|
| JS bundle | < 200 KB gzip. Code splitting по маршрутах. |
| Зображення | WebP + fallback. Каспер: max 150 KB, lazy loading. |
| Анімації | CSS transitions. `prefers-reduced-motion` підтримується. |
| LCP | < 2.5s на емульованому 3G (Lighthouse). |

### Платформені особливості

| Платформа | Правило |
|-----------|---------|
| iOS Safari | `-webkit-touch-callout: none` на зображеннях |
| Android | `history.back()` для back button |
| Клавіатура | `visualViewport API` для коректного layout |
| Темна тема | Фіксована світла тема в v0.1. `prefers-color-scheme` — v0.2+ |

---

## 4. Структура даних (TypeScript)

### Dexie ініціалізація

```typescript
const db = new Dexie('casper-db');
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

### Profile

```typescript
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

```typescript
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

```typescript
interface CheckIn {
  id?: number;
  activityId: number;
  profileId: number;
  type: 'before' | 'after';
  date: string;
  // before
  sleep?: 1 | 2 | 3 | 4 | 5;
  fatigue?: 1 | 2 | 3 | 4 | 5;
  pain: boolean;
  painDetails?: string;
  painZone?: string;
  readiness?: 1 | 2 | 3 | 4 | 5;
  mood?: 1 | 2 | 3 | 4 | 5;
  conditions?: 'outdoor' | 'indoor' | 'gym';
  operationZoneDiscomfort?: boolean;  // ⚠️ ТІЛЬКИ ДЛЯ ОЛЕНИ
  // after
  difficulty?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  fatigueAfter?: 1 | 2 | 3 | 4 | 5;
  discomfortAfter?: boolean;
  discomfortDetails?: string;
  feeling?: 'better' | 'same' | 'worse';
  nextTimeChange?: string;
  notesAfter?: string;
  redFlags: string[];
}
```

### Recommendation

```typescript
interface Recommendation {
  id?: number;
  profileId: number;
  date: string;
  targetDuration: number;
  paceType: 'comfortable' | 'normal' | 'with-acceleration' | 'rest';
  cautionLevel: 'green' | 'yellow' | 'red';
  reason: string;               // 1 речення для UI
  safetyNotes?: string;         // примітка для Олени
  nextStep?: string;
  casperPhrase: string;
}
```

### SafetyFlag

```typescript
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

---

## 5. Логіка рекомендацій (rule-based AI)

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

```typescript
function generateRecommendation(profile, preCheck, history): Recommendation {
  // 1. Safety gate — медичні обмеження мають найвищий пріоритет
  const noRun = profile.medical.prohibitions.toLowerCase().includes('не бігти');

  // 2. Red flags
  const lastAfter = getLastCheckin(profile.id, 'after');
  if (lastAfter?.redFlags?.length > 0) {
    return makeSafeRec('Є тривожні симптоми. Сьогодні відпочиваємо.', 'red');
  }

  // 3. State score (0-100)
  const score = (preCheck.sleep ?? 3) * 10
              + (preCheck.readiness ?? 3) * 10
              + (5 - (preCheck.fatigue ?? 3)) * 10
              + (preCheck.pain ? -25 : 0)
              + (preCheck.operationZoneDiscomfort ? -30 : 0);

  // 4. History
  const avgDiff = avg(history.slice(-7).map(a => a.lastDifficulty ?? 5));
  const streak  = calcStreak(history);

  // 5-6. Duration + pace
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
  return {
    targetDuration: duration, paceType: pace, cautionLevel: caution,
    reason: buildReason(score, avgDiff, streak),
    casperPhrase: pickPhrase(caution)
  };
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

### Словник фраз (casperPhrases.ts)

```typescript
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

## 6. Правила безпеки — обов'язкові

### Червоні прапорці → зупинка

| Симптом | Дія системи |
|---------|------------|
| Біль у грудях / різкий дискомфорт | `cautionLevel='red'` · Зупинити · Показати попередження |
| Задишка / запаморочення / слабкість | `cautionLevel='red'` · `targetDuration=0` · Зберегти SafetyFlag |
| Сильний біль у зоні операції (Олена) | `cautionLevel='red'` · Навантаження=0 · Порадити лікаря |
| Погане відновлення наступного дня | `cautionLevel='yellow'` · Не підвищувати duration |
| Симптом позначений як тривожний | `cautionLevel='red'` завжди |

### Обов'язковий текст безпеки (Налаштування → Про додаток)

> «Цей застосунок не є медичною консультацією. Якщо є гострий біль, різке погіршення стану або лікарські обмеження — тренування треба узгоджувати з лікарем або реабілітологом.»

### Приватність медичних даних

| Правило | Деталь |
|---------|--------|
| Медичні дані Олени | НЕ видно Сержу ніде. Тільки статус «режим відновлення». |
| Зберігання | v0.1 — виключно локально. Жодної передачі на сервер. |
| Видалення | Кнопка «Видалити всі дані» з підтвердженням. Чистить IndexedDB. |

---

## 7. Що будувати в v0.1 — чеклист

**PWA-основа:** manifest.json · service worker · offline fallback · install prompt · iOS meta-теги · HTTPS деплой

**Онбординг:** splash → 7 кроків → збереження Profile → пропуск при повторному запуску

**Вибір профілю:** картки Серж/Олена · кнопка «Разом» · `activeProfileId` в appState

**Головна:** шапка → рекомендація дня → «Почати» → «День відновлення» → 4 KPI → тренд самопочуття → ціль тижня → фраза Каспера

**Активність:** Pre-check → Таймер (пауза/завершити) → підказки → Post-check → збереження → картка висновку

**Журнал:** список (зворотна хронологія) · фільтр · картки · деталі · порожній стан

**Статистика:** перемикач Серж/Олена/Разом · KPI · бар-чарт · лінія самопочуття · прогрес-бар · тижневий підсумок

**Налаштування:** профіль · здоров'я (захищений) · розклад · нагадування · Garmin ручний ввід · toggle звуку · текст застереження · видалення даних

**Таб-бар:** bottom nav 4 пункти · активний помаранчевий · back Android · slide-transition в активності

---

## 8. Що НЕ будувати в v0.1

```
⛔ Backend / сервер / Node.js API / база на сервері
⛔ Авторизація (Google Sign-In, email/password)
⛔ Хмарна синхронізація
⛔ Garmin API (тільки ручне введення)
⛔ Бігові плани або інтервали (тільки ходьба)
⛔ ML / LLM API (rule-based TypeScript)
⛔ Соціальний sharing / leaderboard
⛔ ІМТ, VO2max, пульсові зони
⛔ Кілька пар або груп
⛔ Платежі / підписки / paywall
⛔ Dark mode (v0.2+)
⛔ Десктоп-оптимізація (mobile-first)
```

---

## 9. Приймальні критерії (18 AC)

### PWA

| # | Критерій | Як перевірити |
|---|----------|--------------|
| **AC-01** | Lighthouse PWA ≥ 90 | Chrome DevTools → Lighthouse |
| **AC-02** | Встановлюється на Android Chrome | Телефон → «Додати на головний екран» |
| **AC-03** | Встановлюється на iOS Safari | iPhone → Share → «На головний екран» |
| **AC-04** | Offline після 1-го завантаження | DevTools → Network → Offline → перезавантажити |
| **AC-05** | LCP < 2.5s на 3G | Lighthouse → Performance |

### Mobile-first

| # | Критерій | Як перевірити |
|---|----------|--------------|
| **AC-06** | Tap target ≥ 44px скрізь | DevTools Accessibility |
| **AC-07** | Input font-size ≥ 16px (без zoom iOS) | Відкрити форму на iPhone |
| **AC-08** | Safe-area коректно (notch) | iPhone X+ або симулятор |
| **AC-09** | Таб-бар не перекриває контент при клавіатурі | Відкрити поле → CTA видимий |
| **AC-10** | Скрол плавний 20+ записів у Журналі | Реальний пристрій |

### Логіка продукту

| # | Критерій | Як перевірити |
|---|----------|--------------|
| **AC-11** | Онбординг зберігає Profile в IndexedDB | DevTools → Application → IndexedDB |
| ⚠️ **AC-12** | **Медичні обмеження зчитуються до рекомендації** | Додати 'не бігти' → без прискорення |
| ⚠️ **AC-13** | **Червоний прапорець = paceType='rest'** | Pre-check: біль у грудях → rest |
| **AC-14** | Медичні дані Олени невидимі Сержу | Перевірити всі спільні екрани |
| **AC-15** | Activity + CheckIn зберігаються та відображаються | Завершити → знайти в Журналі |
| **AC-16** | Статистика фільтрується Серж / Олена / Разом | Перевірити всі 3 вкладки |
| ⚠️ **AC-17** | **Олена НІКОЛИ не отримує 'with-acceleration'** | 10 ідеальних сесій → перевірити |
| **AC-18** | Streak розраховується коректно | 3 дні → streak=3. Пропуск → streak=0 |

> ⚠️ AC-12, AC-13, AC-17 — критичні. Порушення неприпустиме.

---

## 10. Порядок реалізації (суворий)

```
Крок 1: db.ts + types.ts → App.tsx роутинг → TabBar → SafeAreaWrapper → BaseUI
Крок 2: Welcome splash → 7 кроків онбордингу → ProfileSelect → збереження Profile
Крок 3: recommendation.ts → safetyCheck.ts → streak.ts → casperPhrases.ts (+unit-тести AC-12,13,17)
Крок 4: Home → useRecommendation → useWeekStats
Крок 5: Activity (PreCheck → Таймер → PostCheck → Висновок)
Крок 6: Journal (список · фільтр · деталі · порожній стан)
Крок 7: Statistics (Серж / Олена / Разом · Recharts)
Крок 8: Settings (профіль · здоров'я · розклад · система · текст безпеки)
Крок 9: PWA audit · іконки · offline fallback · деплой → Lighthouse ≥ 90
```

---

*Каспер. Крок за кроком. · ТЗ для AI-розробника v0.1 · Травень 2026*
