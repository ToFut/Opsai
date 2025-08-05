import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'OPSAI Core - Build Your SaaS App in Minutes',
  description: 'Generate complete vertical SaaS applications with AI-powered configuration. From idea to production-ready app.',
  keywords: 'SaaS generator, vertical SaaS, app builder, business application, API integration',
  authors: [{ name: 'OPSAI Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
            // Handle custom element conflicts and other common errors
            if (typeof window !== 'undefined') {
              // Prevent custom element conflicts
              const originalDefine = window.customElements.define;
              window.customElements.define = function(name, constructor, options) {
                try {
                  if (window.customElements.get(name)) {
                    console.warn('Custom element already defined, skipping:', name);
                    return;
                  }
                  return originalDefine.call(this, name, constructor, options);
                } catch (e) {
                  console.warn('Custom element definition failed, ignoring:', name, e.message);
                }
              };

              // Handle uncaught errors
              window.addEventListener('error', function(e) {
                if (e.message && (
                  e.message.includes('mce-autosize-textarea') ||
                  e.message.includes('custom element') ||
                  e.message.includes('already been defined') ||
                  e.message.includes('has already been used with this registry')
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
                  e.reason.includes('already been defined') ||
                  e.reason.includes('has already been used with this registry')
                )) {
                  console.warn('Custom element promise rejection ignored:', e.reason);
                  e.preventDefault();
                  return false;
                }
              });
              
              // Override console.error to filter custom element errors
              const originalError = console.error;
              console.error = function(...args) {
                const errorStr = args.join(' ');
                if (errorStr.includes('mce-autosize-textarea') || 
                    errorStr.includes('custom element') ||
                    errorStr.includes('already been defined') ||
                    errorStr.includes('has already been used with this registry')) {
                  console.warn('Filtered custom element error:', ...args);
                  return;
                }
                originalError.apply(console, args);
              };

              // Handle 404 errors for static assets gracefully
              window.addEventListener('error', function(e) {
                if (e.target && e.target.src && e.target.src.includes('/_next/static/')) {
                  console.warn('Static asset 404, will retry:', e.target.src);
                  // Don't prevent default for 404s, let them retry
                }
              }, true);
            }
          `
        }} />
        {children}
      </body>
    </html>
  )
}