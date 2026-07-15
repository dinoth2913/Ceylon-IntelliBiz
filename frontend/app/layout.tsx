import { Outfit } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import { AiChatWidget } from '@/components/ai-chat-widget';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Ceylon IntelliBiz | AI Operating Platform',
  description: 'AI-powered business operating platform for Sri Lanka',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased">
        {children}
        <AiChatWidget />
      </body>
    </html>
  );
}
