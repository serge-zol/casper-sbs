import { Home, Timer, BookOpen, BarChart2 } from 'lucide-react'
import type { Screen } from '@/App'

interface TabBarProps {
  active: Screen
  onNavigate: (screen: Screen) => void
}

const TABS = [
  { id: 'home'       as Screen, label: 'Дім',      Icon: Home     },
  { id: 'activity'   as Screen, label: 'Рух',      Icon: Timer    },
  { id: 'journal'    as Screen, label: 'Журнал',   Icon: BookOpen },
  { id: 'statistics' as Screen, label: 'Підсумки', Icon: BarChart2 },
]

export default function TabBar({ active, onNavigate }: TabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-casper-sand z-50 flex"
      style={{
        height: 'calc(56px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
            style={{
              minHeight: 44,
              color: isActive ? '#E85B16' : '#666666',
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
