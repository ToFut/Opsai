import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface StatsCardProps {
  title: string
  value: number | string
  change?: number
  href?: string
}

export function StatsCard({ title, value, change, href }: StatsCardProps) {
  const content = (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {change !== undefined && (
          <p className={`ml-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </p>
        )}
      </div>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}