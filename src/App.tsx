import { useState } from 'react'
import SafeAreaWrapper from '@/components/layout/SafeAreaWrapper'
import TabBar from '@/components/layout/TabBar'

export type Screen =
  | 'welcome'
  | 'profile-select'
  | 'home'
  | 'activity'
  | 'journal'
  | 'statistics'
  | 'settings'

const TAB_SCREENS: Screen[] = ['home', 'activity', 'journal', 'statistics']

function getInitialScreen(): Screen {
  const done = localStorage.getItem('onboardingDone')
  return done ? 'profile-select' : 'welcome'
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen)

  return (
    <SafeAreaWrapper>
      <ScreenPlaceholder screen={screen} onNavigate={setScreen} />
      {TAB_SCREENS.includes(screen) && (
        <TabBar active={screen} onNavigate={setScreen} />
      )}
    </SafeAreaWrapper>
  )
}

// Тимчасовий роутер — замінюється екранами у Кроках 2–8
function ScreenPlaceholder({
  screen,
  onNavigate,
}: {
  screen: Screen
  onNavigate: (s: Screen) => void
}) {
  const ALL_SCREENS: Screen[] = [
    'welcome', 'profile-select', 'home',
    'activity', 'journal', 'statistics', 'settings',
  ]

  return (
    <div
      className="flex flex-col items-center justify-center bg-casper-cream text-casper-graphite px-6"
      style={{
        minHeight: '100dvh',
        paddingBottom: TAB_SCREENS.includes(screen)
          ? 'calc(56px + env(safe-area-inset-bottom) + 16px)'
          : '0',
      }}
    >
      <span className="text-5xl mb-4">🐾</span>
      <p className="text-xl font-semibold text-casper-dark-green mb-1">Каспер</p>
      <p className="text-sm text-gray-400 mb-8">{screen}</p>

      <div className="flex flex-wrap gap-2 justify-center">
        {ALL_SCREENS.map(s => (
          <button
            key={s}
            onClick={() => onNavigate(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{
              background: screen === s ? '#E85B16' : 'transparent',
              color: screen === s ? '#fff' : '#1F2A2E',
              borderColor: screen === s ? '#E85B16' : '#FCE7D2',
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
