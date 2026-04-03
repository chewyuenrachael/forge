import { Fraunces, DM_Sans, JetBrains_Mono } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['600'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Forge | Goodfire Commercial Intelligence',
  description: 'Commercial intelligence operating system for Goodfire — advancing AI interpretability',
}

// Next.js App Router requires default export for layout
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-base text-text-primary min-h-screen">
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}

export default RootLayout
