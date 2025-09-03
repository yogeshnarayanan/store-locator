import * as React from 'react'
import clsx from 'clsx'

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-gray-200 shadow-sm bg-white',
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
  return <div className={clsx('p-4', className)} {...props} />
}
export default Card
