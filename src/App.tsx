import { useState, lazy, Suspense, useEffect } from 'react'

declare const __BUILD_LABEL__: string
import SafeAreaWrapper from '@/components/layout/SafeAreaWrapper'
import TabBar from '@/components/layout/TabBar'
import Onboarding from '@/components/screens/Onboarding'
import ProfileSelect from '@/components/screens/ProfileSelect'
import ImportProfile from '@/components/screens/ImportProfile'
import Home from '@/components/screens/Home'
import Activity from '@/components/screens/Activity'
import Journal from '@/components/screens/Journal'
import Settings from '@/components/screens/Settings'
import type { Profile } from '@/db/types'

// Statistics has Recharts → ~150KB. Lazy to keep initial bundle small.
const Statistics = lazy(() => import('@/components/screens/Statistics'))

export type Screen =
  | 'welcome'
  | 'profile-select'
  | 'import-profile'
  | 'home'
  | 'activity'
  | 'journal'
  | 'statistics'
  | 'settings'

const TAB_SCREENS: Screen[] = ['home', 'activity', 'journal', 'statistics']

function getInitialScreen(): Screen {
  return localStorage.getItem('onboardingDone') ? 'profile-select' : 'welcome'
}

function parseImportParam(): Profile | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('import')
    if (!raw) return null
    return JSON.parse(decodeURIComponent(escape(atob(raw)))) as Profile
  } catch {
    return null
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen)
  const [importedProfile, setImportedProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const profile = parseImportParam()
    if (profile) {
      setImportedProfile(profile)
      setScreen('import-profile')
    }
  }, [])

  return (
    <SafeAreaWrapper>
      <ScreenRouter
        screen={screen}
        importedProfile={importedProfile}
        onNavigate={setScreen}
        onImportDone={() => {
          setImportedProfile(null)
          setScreen('profile-select')
        }}
      />
      {TAB_SCREENS.includes(screen) && (
        <TabBar active={screen} onNavigate={setScreen} />
      )}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        fontSize: 10, color: 'rgba(0,0,0,0.25)', textAlign: 'right',
        fontStyle: 'italic', padding: '2px 0', paddingRight: 8,
        pointerEvents: 'none',
      }}>
        {__BUILD_LABEL__}
      </div>
    </SafeAreaWrapper>
  )
}

function ScreenRouter({
  screen,
  importedProfile,
  onNavigate,
  onImportDone,
}: {
  screen: Screen
  importedProfile: Profile | null
  onNavigate: (s: Screen) => void
  onImportDone: () => void
}) {
  switch (screen) {
    case 'welcome':
      return <Onboarding onComplete={() => onNavigate('profile-select')} />
    case 'profile-select':
      return <ProfileSelect onNavigate={onNavigate} />
    case 'import-profile':
      if (!importedProfile) {
        onNavigate('profile-select')
        return null
      }
      return (
        <ImportProfile
          profile={importedProfile}
          onConfirm={onImportDone}
          onCancel={() => {
            window.history.replaceState({}, '', window.location.pathname)
            onNavigate('profile-select')
          }}
        />
      )
    case 'home':
      return <Home onNavigate={onNavigate} />
    case 'activity':
      return <Activity onNavigate={onNavigate} />
    case 'journal':
      return <Journal onNavigate={onNavigate} />
    case 'statistics':
      return (
        <Suspense fallback={<div style={{minHeight:'100dvh',background:'#FFF7EC'}} className="flex items-center justify-center"><img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={32} style={{ width: 32, height: 'auto' }} /></div>}>
          <Statistics onNavigate={onNavigate} />
        </Suspense>
      )
    case 'settings':
      return <Settings onNavigate={onNavigate} />
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
      <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={56} className="mb-4" style={{ width: 56, height: 'auto' }} />
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
