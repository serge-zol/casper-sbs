import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

export default function Button({ variant = 'primary', children, style, ...props }: Props) {
  return (
    <button
      {...props}
      style={{
        width: '100%',
        padding: '14px 24px',
        borderRadius: 16,
        fontSize: 16,
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        minHeight: 56,
        background: variant === 'primary' ? '#E85B16' : '#FCE7D2',
        color: variant === 'primary' ? '#fff' : '#1F2A2E',
        opacity: props.disabled ? 0.6 : 1,
        transition: 'opacity 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
