import type { Metadata } from 'next';
import siteStyles from '@/lib/site-styles.generated.json';
export const metadata: Metadata = {
  title: 'BASILISK · Acquisition Shortlist',
  description:
    'Four acquisition candidates, property research and conditional demand-response underwriting.',
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <style id="basilisk-styles" dangerouslySetInnerHTML={{ __html: siteStyles.styles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
