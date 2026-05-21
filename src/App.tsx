import { useState, lazy, Suspense } from 'react'
import SafeAreaWrapper from '@/components/layout/SafeAreaWrapper'
import TabBar from '@/components/layout/TabBar'
import Onboarding from '@/components/screens/Onboarding'
import ProfileSelect from '@/components/screens/ProfileSelect'
import Home from '@/components/screens/Home'
import Activity from '@/components/screens/Activity'
import Journal from '@/components/screens/Journal'

// Statistics has Recharts → ~150KB. Lazy to keep initial bundle small.
const Statistics = lazy(() => import('@/components/screens/Statistics'))

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
  return localStorage.getItem('onboardingDone') ? 'profile-select' : 'welcome'
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen)

  return (
    <SafeAreaWrapper>
      <ScreenRouter screen={screen} onNavigate={setScreen} />
      {TAB_SCREENS.includes(screen) && (
        <TabBar active={screen} onNavigate={setScreen} />
      )}
    </SafeAreaWrapper>
  )
}

function ScreenRouter({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  switch (screen) {
    case 'welcome':
      return <Onboarding onComplete={() => onNavigate('profile-select')} />
    case 'profile-select':
      return <ProfileSelect onNavigate={onNavigate} />
    case 'home':
      return <Home onNavigate={onNavigate} />
    case 'activity':
      return <Activity onNavigate={onNavigate} />
    case 'journal':
      return <Journal onNavigate={onNavigate} />
    case 'statistics':
      return (
        <Suspense fallback={<div style={{minHeight:'100dvh',background:'#FFF7EC'}} className="flex items-center justify-center"><span className="text-3xl">🐾</span></div>}>
          <Statistics onNavigate={onNavigate} />
        </Suspense>
      )
    default:
      return <PlaceholderScreen screen={screen} onNavigate={onNavigate} />
  }
}

function PlaceholderScreen({
  screen, onNavigate,
}: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const ALL: Screen[] = ['welcome', 'profile-select', 'home', 'activity', 'journal', 'statistics', 'settings']

  return (
    <div
      className="flex flex-col items-center justify-center px-6"
      style={{
        minHeight: '100dvh',
        background: '#FFF7EC',
        paddingBottom: TAB_SCREENS.includes(screen)
          ? 'calc(56px + env(safe-area-inset-bottom) + 16px)'
          : 0,
      }}
    >
      <span className="text-5xl mb-4">🐾</span>
      <p className="text-xl font-semibold mb-1" style={{ color: '#053E35' }}>Каспер</p>
      <p className="text-sm text-gray-400 mb-8">{screen}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {ALL.map(s => (
          <button
            key={s}
            onClick={() => onNavigate(s)}
            className="rounded-full text-xs font-medium border px-3 py-1.5"
            style={{
              background: screen === s ? '#E85B16' : 'transparent',
              color: screen === s ? '#fff' : '#1F2A2E',
              borderColor: screen === s ? '#E85B16' : '#FCE7D2',
              minHeight: 36,
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
