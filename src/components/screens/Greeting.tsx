import { useEffect, useRef } from 'react'
import type { Profile } from '@/db/types'

const PHRASES = [
  'Я вже чекав. Рушаємо?',
  'Готовий до кроку?',
  'Каспер тут. Йдемо разом?',
  'Добре, що ти тут. Починаємо?',
]

export default function Greeting({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const phrase = useRef(PHRASES[Math.floor(Math.random() * PHRASES.length)]).current

  useEffect(() => {
    // Play cat-twit — AudioContext already unlocked by Splash tap
    let ctx: AudioContext | null = null
    ;(async () => {
      try {
        ctx = new AudioContext()
        await ctx.resume()
        const resp = await fetch(`${import.meta.env.BASE_URL}cat-twit.mp3`)
        const ab = await resp.arrayBuffer()
        const buffer = await ctx.decodeAudioData(ab)
        const src = ctx.createBufferSource()
        src.buffer = buffer
        src.connect(ctx.destination)
        src.start()
        src.onended = () => ctx?.close()
      } catch {
        ctx?.close().catch(() => {})
      }
    })()

    const timer = setTimeout(() => onDoneRef.current(), 2000)
    return () => {
      clearTimeout(timer)
      ctx?.close().catch(() => {})
    }
  }, [])

  return (
    <div
      onClick={() => onDoneRef.current()}
      className="flex flex-col items-center justify-center px-8 text-center"
      style={{ minHeight: '100dvh', background: '#053E35', cursor: 'pointer' }}
    >
      <img
        src={`${import.meta.env.BASE_URL}cat-paw.png`}
        alt=""
        width={48}
        className="mb-8"
        style={{ width: 48, height: 'auto' }}
      />
      <h1
        className="text-4xl font-bold mb-4 leading-tight"
        style={{ color: '#E85B16', letterSpacing: '-0.01em' }}
      >
        Привіт, {profile.name}!
      </h1>
      <p className="text-base leading-snug max-w-xs" style={{ color: '#FFF7EC' }}>
        {phrase}
      </p>
    </div>
  )
}
