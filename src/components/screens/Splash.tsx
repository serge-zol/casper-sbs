export default function Splash({ onDone }: { onDone: () => void }) {

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onDone}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onDone() }}
      className="flex flex-col items-center justify-center px-8 text-center"
      style={{ minHeight: '100dvh', background: '#053E35', cursor: 'pointer' }}
    >
      <img
        src={`${import.meta.env.BASE_URL}cat-paw.png`}
        alt="Сліди Каспера"
        width={80}
        className="mb-8"
        style={{ width: 80, height: 'auto' }}
      />

      <h1
        className="text-4xl font-bold mb-5 leading-tight"
        style={{ color: '#E85B16', letterSpacing: '-0.01em' }}
      >
        Каспер.<br />Крок за кроком.
      </h1>

      <p
        className="text-base mb-6 leading-snug max-w-xs"
        style={{ color: '#FFF7EC' }}
      >
        AI-супутник<br />
        для поступового повернення у форму
      </p>

      <p
        className="text-base font-semibold"
        style={{ color: '#F39A2F', letterSpacing: '0.02em' }}
      >
        Не рекорд. Ритм, що тримає.
      </p>
    </div>
  )
}
