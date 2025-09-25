import * as React from 'react'
import clsx from 'clsx'

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        // Base shape & background
        'rounded-2xl border-2 border-gray-200 bg-white shadow-lg',
        // Hover effects (shrink a little, thicker border color)
        'hover:scale-95 hover:border-blue-500 hover:shadow-xl',
        'transition-transform transition-colors transition-shadow duration-300 ease-in-out',
        'cursor-pointer',
        className
      )}
      {...props}
    />
  )
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        // Padding
        'p-5 space-y-2',
        // Font & colors
        'text-gray-700 font-medium tracking-wide',
        // Background subtle
        'bg-gradient-to-br from-white via-gray-50 to-gray-100',
        // Rounded inner container
        'rounded-xl',
        // Smooth hover text color shift
        'hover:text-blue-700',
        className
      )}
      {...props}
    />
  )
}

export default Card
