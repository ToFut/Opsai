'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Package, BarChart3, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  return (
    <div className="flex flex-col w-64 bg-gray-900">
      <div className="flex h-16 items-center px-4 bg-gray-800">
        <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md
                ${isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 h-5 w-5 flex-shrink-0
                  ${isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-gray-300'
                  }
                `}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
        <button
          onClick={handleLogout}
          className="flex-shrink-0 w-full group block"
        >
          <div className="flex items-center">
            <LogOut className="inline-block h-5 w-5 text-gray-400 group-hover:text-gray-300" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300 group-hover:text-white">
                Logout
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
