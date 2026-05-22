import { QRCodeSVG } from 'qrcode.react'
import type { Profile } from '@/db/types'

interface Props {
  profile: Profile
  onClose: () => void
}

export default function ShareProfileModal({ profile, onClose }: Props) {
  const { id: _id, ...profileWithoutId } = profile
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(profileWithoutId))))
  const shareUrl = `https://serge-zol.github.io/casper-sbs/?import=${encoded}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(5,62,53,0.5)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Поділитись профілем"
        className="w-full rounded-t-3xl px-6 pt-6 pb-10"
        style={{ background: '#FFF7EC', maxWidth: 480 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#053E35' }}>Поділитись профілем</h2>
            <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Партнер сканує QR своєю камерою</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрити"
            className="rounded-full flex items-center justify-center"
            style={{ width: 36, height: 36, background: '#FCE7D2', color: '#E85B16' }}
          >
            ✕
          </button>
        </div>

        <div
          className="rounded-2xl flex flex-col items-center py-6 px-4 mb-5"
          style={{ background: '#fff', border: '1.5px solid #FCE7D2' }}
        >
          <div
            className="rounded-xl p-3 mb-4"
            style={{ background: '#FFF7EC', border: '2px solid #E85B16' }}
          >
            <QRCodeSVG
              value={shareUrl}
              size={200}
              bgColor="#FFF7EC"
              fgColor="#053E35"
              level="M"
            />
          </div>
          <p className="font-semibold text-base" style={{ color: '#1F2A2E' }}>{profile.name}</p>
          <p className="text-xs mt-1" style={{ color: '#666666' }}>
            {profile.medical.inRecovery ? '🟡 Режим відновлення' : '🟢 Звичайний режим'}
          </p>
        </div>

        <p className="text-xs text-center" style={{ color: '#666666' }}>
          Після сканування партнер підтвердить імпорт — і ви зможете тренуватись разом
        </p>
      </div>
    </div>
  )
}
