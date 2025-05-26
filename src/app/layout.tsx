import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PR Pro - PR会社用調整Webサービス',
  description: 'PR会社とクライアント間の調整業務を効率化し、プロジェクト管理を一元化するWebサービス',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}