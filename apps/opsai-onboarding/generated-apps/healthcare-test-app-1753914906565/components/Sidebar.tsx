'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Activity, Shield, GraduationCap, Award, Database, Database } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Medical Devices', href: '/medical-devices', icon: Activity },
  { name: 'Compliance', href: '/compliance', icon: Shield },
  { name: 'Training', href: '/training', icon: GraduationCap },
  { name: 'Certifications', href: '/certifications', icon: Award },
  { name: 'Patients', href: '/patients', icon: Database },
  { name: 'Treatments', href: '/treatments', icon: Database }
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-xl font-bold text-white">Healthcare Test</h1>
      </div>
      <nav className="flex flex-1 flex-col px-6 pb-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}