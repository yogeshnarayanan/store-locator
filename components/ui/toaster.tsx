'use client'
import * as React from 'react'

type Toast = {
  id: number
  title?: string
  message?: string
  type?: 'success' | 'error' | 'info'
}
const Ctx = React.createContext<{
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
} | null>(null)

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const push = (t: Omit<Toast, 'id'>) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, ...t }])
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 2500)
  }
  return (
    <Ctx.Provider value={{ toasts, push }}>
      {children}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map(t => {
          const bgColor = t.type === 'success'
            ? 'bg-green-600'
            : t.type === 'error'
            ? 'bg-red-600'
            : 'bg-black'
          const text = t.message || t.title || ''
          return (
            <div
              key={t.id}
              className={`rounded-xl text-white px-4 py-2 text-sm shadow ${bgColor}`}
            >
              {text}
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToasterProvider')
  return { push: ctx.push }
}
