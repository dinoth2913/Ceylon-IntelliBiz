import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ceylon IntelliBiz',
  description: 'AI-powered business operating platform for Sri Lanka'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
