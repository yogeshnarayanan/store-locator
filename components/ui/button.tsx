import * as React from 'react'
import clsx from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}
export function Button({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: Props) {
  const variants = {
    default: 'bg-black text-white hover:opacity-90',
    outline: 'border border-gray-300 hover:bg-gray-50',
  } as const
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-9 px-4',
    lg: 'h-10 px-6 text-base',
  } as const
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl transition',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
export default Button
