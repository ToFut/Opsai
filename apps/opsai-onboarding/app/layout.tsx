import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OPSAI Core - Build Your SaaS App in Minutes',
  description: 'Generate complete vertical SaaS applications with AI-powered configuration. From idea to production-ready app.',
  keywords: 'SaaS generator, vertical SaaS, app builder, business application, API integration',
  authors: [{ name: 'OPSAI Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Handle custom element conflicts
            if (typeof window !== 'undefined') {
              // Handle uncaught errors
              window.addEventListener('error', function(e) {
                if (e.message && (
                  e.message.includes('mce-autosize-textarea') ||
                  e.message.includes('custom element') ||
                  e.message.includes('already been defined')
                )) {
                  console.warn('Custom element conflict detected and ignored:', e.message);
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
              });
              
              // Handle unhandled promise rejections
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && typeof e.reason === 'string' && (
                  e.reason.includes('mce-autosize-textarea') ||
                  e.reason.includes('custom element') ||
                  e.reason.includes('already been defined')
                )) {
                  console.warn('Custom element promise rejection ignored:', e.reason);
                  e.preventDefault();
                  return false;
                }
              });
              
              // Override console.error temporarily to catch and filter custom element errors
              const originalError = console.error;
              console.error = function(...args) {
                const errorStr = args.join(' ');
                if (errorStr.includes('mce-autosize-textarea') || 
                    errorStr.includes('custom element') ||
                    errorStr.includes('already been defined')) {
                  console.warn('Filtered custom element error:', ...args);
                  return;
                }
                originalError.apply(console, args);
              };
            }
          `
        }} />
        {children}
      </body>
    </html>
  )
}