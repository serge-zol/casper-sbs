import type { ReactNode } from 'react'

export default function SafeAreaWrapper({ children }: { children: ReactNode }) {
  return <div className="relative">{children}</div>
}
