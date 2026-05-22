import { useEffect } from 'react'
import type { Screen } from '@/App'

export default function Splash({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const lastProfileId = localStorage.getItem('lastProfileId')
      if (lastProfileId) {
        onNavigate('home')
      } else {
        onNavigate('profile-select')
      }
    }, 1800)
    return () => clearTimeout(timer)
  }, [onNavigate])

  return (
    <div
      style={{ minHeight: '100dvh', background: '#FFF7EC' }}
      className="flex flex-col items-center justify-center gap-3"
    >
      <img
        src={`${import.meta.env.BASE_URL}cat-paw.png`}
        alt=""
        width={64}
        style={{ width: 64, height: 'auto' }}
      />
      <p className="text-2xl font-bold" style={{ color: '#053E35' }}>Каспер</p>
      <p className="text-sm" style={{ color: '#9CA3AF' }}>Крок за кроком.</p>
    </div>
  )
}
