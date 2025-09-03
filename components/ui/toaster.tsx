'use client';
import * as React from 'react';

type Toast = { id: number; title: string };
const Ctx = React.createContext<{ toasts: Toast[]; push: (t: Omit<Toast, 'id'>)=>void }|null>(null);

export function ToasterProvider({ children }: { children: React.ReactNode }){
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = (t: Omit<Toast, 'id'>) => {
    const id = Date.now();
    setToasts((prev)=>[...prev, { id, ...t }]);
    setTimeout(()=>setToasts((prev)=>prev.filter(x=>x.id!==id)), 2500);
  };
  return <Ctx.Provider value={{ toasts, push }}>
    {children}
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts.map(t => <div key={t.id} className="rounded-xl bg-black text-white px-4 py-2 text-sm shadow">{t.title}</div>)}
    </div>
  </Ctx.Provider>;
}

export function useToast(){
  const ctx = React.useContext(Ctx);
  if(!ctx) throw new Error("useToast must be used within ToasterProvider");
  return { toast: ctx.push };
}
