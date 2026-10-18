import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'BASILISK · PJM Origination',
  description: 'Evidence-first PJM behind-the-meter demand-response prospecting.',
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
