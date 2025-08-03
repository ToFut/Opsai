'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestUIPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">UI Components Test</h1>
      
      <Card className="p-6 mb-4">
        <h2 className="text-lg font-semibold mb-4">Form Components</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-input">Test Input</Label>
            <Input id="test-input" placeholder="Enter text here" />
          </div>
          
          <Button>Test Button</Button>
        </div>
      </Card>
      
      <p>✅ If you can see this page, the UI components are working!</p>
    </div>
  )
}