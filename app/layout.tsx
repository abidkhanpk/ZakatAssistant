import './globals.css';
import type { Metadata } from 'next';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: 'Zakat Assistant',
  description: 'Zakat calculation app which will keep record of your previous years calculations as well.',
  applicationName: 'Zakat Assistant',
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
