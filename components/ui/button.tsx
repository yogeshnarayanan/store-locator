import * as React from 'react'
import clsx from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'primary' | 'danger'
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
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-800',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  } as const

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-9 px-4 text-base',
    lg: 'h-10 px-6 text-lg',
  } as const

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl font-medium transition-shadow shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}

export default Button
