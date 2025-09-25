import * as React from 'react'
import clsx from 'clsx'

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition-all duration-200',
      'hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm hover:shadow-md',
      className
    )}
    {...props}
  />
))

Input.displayName = 'Input'
export default Input
