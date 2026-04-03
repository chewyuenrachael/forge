import { type FC, type ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export const PageContainer: FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`max-w-[1400px] mx-auto px-10 py-8 ${className}`}>
      {children}
    </div>
  )
}
