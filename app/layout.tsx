import './globals.css';
import type { Metadata } from 'next';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: 'ZakatAssistant',
  description: 'Production-ready Zakat management app',
  applicationName: 'ZakatAssistant',
  manifest: '/manifest.webmanifest'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
