import React, { useState } from 'react'

interface TabsProps {
  children: React.ReactNode
  defaultValue?: string
  className?: string
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

interface TabsTriggerProps {
  children: React.ReactNode
  value: string
  className?: string
}

interface TabsContentProps {
  children: React.ReactNode
  value: string
  className?: string
}

export function Tabs({ children, defaultValue, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || '')
  
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab })
        }
        return child
      })}
    </div>
  )
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

export function TabsTrigger({ 
  children, 
  value, 
  className = '',
  ...props 
}: TabsTriggerProps & { activeTab?: string; setActiveTab?: (value: string) => void }) {
  const { activeTab, setActiveTab } = props
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab?.(value)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        isActive 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ 
  children, 
  value, 
  className = '',
  ...props 
}: TabsContentProps & { activeTab?: string }) {
  const { activeTab } = props
  
  if (activeTab !== value) {
    return null
  }

  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  )
} 