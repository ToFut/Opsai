import './globals.css'

export const metadata = {
  title: 'Line Properties',
  description: 'Vacation Rental Platform - Find your perfect getaway',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold">🏠 Line Properties</span>
                </div>
                <div className="flex space-x-4">
                  <a href="/" className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600">Home</a>
                  <a href="/Property" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">Properties</a>
                  <a href="/Reservation" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">Reservations</a>
                  <a href="/Guest" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">Guests</a>
                </div>
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}