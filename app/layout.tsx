import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* We use a wrapper div to hold the main layout styles. 
            This prevents browser extensions (like Grammarly) from 
            triggering hydration errors on the <body> tag.
        */}
        <div className="min-h-screen flex flex-col bg-slate-50 antialiased text-slate-900">
          {children}
        </div>
      </body>
    </html>
  );
}