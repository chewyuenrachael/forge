import { type FC, type ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
}

export const PageContainer: FC<PageContainerProps> = ({ children }) => {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-6">
      {children}
    </div>
  )
}
