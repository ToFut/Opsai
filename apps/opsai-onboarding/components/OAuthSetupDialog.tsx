'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'

interface OAuthSetupDialogProps {
  isOpen: boolean
  onClose: () => void
  provider: string
  instructions: string[]
}

export default function OAuthSetupDialog({
  isOpen,
  onClose,
  provider,
  instructions
}: OAuthSetupDialogProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const getProviderDocs = (provider: string): string => {
    const docsMap: Record<string, string> = {
      'google-analytics': 'https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries',
      'shopify': 'https://shopify.dev/docs/apps/auth/oauth',
      'stripe': 'https://stripe.com/docs/connect/oauth-reference',
      'salesforce': 'https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm',
      'hubspot': 'https://developers.hubspot.com/docs/api/oauth',
      'mailchimp': 'https://mailchimp.com/developer/marketing/docs/oauth/',
      'slack': 'https://api.slack.com/authentication/oauth-v2',
      'notion': 'https://developers.notion.com/docs/authorization'
    }
    return docsMap[provider.toLowerCase()] || '#'
  }

  const getEnvVarName = (provider: string): { client: string; secret: string } => {
    const upperProvider = provider.toUpperCase().replace(/-/g, '_')
    return {
      client: `${upperProvider}_CLIENT_ID`,
      secret: `${upperProvider}_CLIENT_SECRET`
    }
  }

  const envVars = getEnvVarName(provider)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            OAuth Setup Required for {provider}
          </DialogTitle>
          <DialogDescription>
            {provider} requires OAuth configuration to connect. Follow the steps below to set it up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm">
              {instructions.some(inst => inst?.includes('Airbyte Cloud'))
                ? 'Airbyte Cloud manages OAuth authentication for you. No need to create OAuth apps manually.'
                : `OAuth authentication ensures secure access to your ${provider} data without storing passwords.`
              }
            </AlertDescription>
          </Alert>

          {instructions.some(inst => inst?.includes('Airbyte Cloud')) ? (
            // Airbyte Cloud instructions
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">✓</span>
                Configure in Airbyte Cloud
              </h3>
              <Card className="p-4 space-y-3">
                {instructions.map((instruction, index) => (
                  instruction && (
                    <div key={index} className="flex items-start gap-2">
                      {instruction.startsWith('Note:') ? (
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      ) : instruction.match(/^\d\./) ? (
                        <span className="text-blue-600 font-semibold mt-0.5">{instruction.substring(0, 2)}</span>
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      )}
                      <p className={`text-sm ${instruction.startsWith('Note:') ? 'font-semibold text-amber-700' : ''}`}>
                        {instruction.match(/^\d\./) ? instruction.substring(3) : instruction}
                      </p>
                    </div>
                  )
                ))}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://cloud.airbyte.com', '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Airbyte Cloud
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            // Regular OAuth instructions
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                Create OAuth App in {provider}
              </h3>
              <Card className="p-4 space-y-3">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{instruction}</p>
                  </div>
                ))}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getProviderDocs(provider), '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View {provider} OAuth Documentation
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {!instructions.some(inst => inst?.includes('Airbyte Cloud')) && (
            <>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
                  Add Redirect URI
                </h3>
                <Card className="p-4">
                  <p className="text-sm mb-2">Add this redirect URI to your OAuth app:</p>
                  <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                    <code className="text-sm flex-1">{window.location.origin}/oauth-success</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(`${window.location.origin}/oauth-success`, -1)}
                    >
                      {copiedIndex === -1 ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</span>
                  Set Environment Variables
                </h3>
                <Card className="p-4">
                  <p className="text-sm mb-3">Add these to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded font-mono text-sm">
                      <span className="flex-1">{envVars.client}=your_client_id_here</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(`${envVars.client}=your_client_id_here`, 0)}
                      >
                        {copiedIndex === 0 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded font-mono text-sm">
                      <span className="flex-1">{envVars.secret}=your_client_secret_here</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(`${envVars.secret}=your_client_secret_here`, 1)}
                      >
                        {copiedIndex === 1 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">4</span>
                  Restart Your Application
                </h3>
                <Card className="p-4">
                  <p className="text-sm">After adding the environment variables, restart your development server for the changes to take effect.</p>
                </Card>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}