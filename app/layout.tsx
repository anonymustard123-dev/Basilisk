import type { Metadata } from 'next';
import './globals.css';
import './brand.css';
export const metadata: Metadata = {
  title: 'BASILISK · Acquisition Shortlist',
  description:
    'Four acquisition candidates, property research and conditional demand-response underwriting.',
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
