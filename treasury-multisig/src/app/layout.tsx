import type { Metadata } from 'next';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Treasury Multisig Wallet',
  description: 'Governance-first multisig treasury management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="container mx-auto py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
