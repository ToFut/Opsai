import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Provider {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: string;
  recordCount?: number;
}

export const IntegrationManager: React.FC<{ userId: string }> = ({ userId }) => {
  const [providers, setProviders] = useState<Provider[]>([
    { id: 'stripe', name: 'Stripe', icon: '💳', connected: false },
    { id: 'quickbooks', name: 'QuickBooks', icon: '📊', connected: false },
    { id: 'shopify', name: 'Shopify', icon: '🛍️', connected: false },
    { id: 'netsuite', name: 'NetSuite', icon: '📈', connected: false },
    { id: 'google', name: 'Google Analytics', icon: '📱', connected: false }
  ]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectionStatus();
  }, [userId]);

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch(`/api/oauth/status/${userId}`);
      const data = await response.json();
      
      setProviders(prev => prev.map(p => {
        const status = data.status.find((s: any) => s.provider === p.id);
        return {
          ...p,
          connected: status?.connected || false,
          lastSync: status?.lastUpdated
        };
      }));

      // Fetch data sync status
      const syncResponse = await fetch(`/api/data-sync/${userId}/status`);
      const syncData = await syncResponse.json();
      
      setProviders(prev => prev.map(p => {
        const syncStatus = syncData.status.find((s: any) => s.provider === p.id);
        return {
          ...p,
          recordCount: syncStatus?.totalRecords
        };
      }));
    } catch (error) {
      console.error('Failed to fetch connection status:', error);
    }
  };

  const handleConnect = async (providerId: string) => {
    setLoading(true);
    
    try {
      if (providerId === 'stripe') {
        // Handle API key based connection
        const apiKey = prompt('Enter your Stripe Secret Key (sk_live_...)');
        if (!apiKey) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/oauth/connect-api-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            provider: 'stripe',
            apiKey
          })
        });

        if (response.ok) {
          alert('Stripe connected successfully!');
          fetchConnectionStatus();
        } else {
          const error = await response.json();
          alert(`Failed to connect Stripe: ${error.error}`);
        }
      } else if (providerId === 'shopify') {
        // Handle Shopify OAuth with shop domain
        const shopDomain = prompt('Enter your Shopify shop domain (e.g., myshop.myshopify.com)');
        if (!shopDomain) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/oauth/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            provider: 'shopify',
            metadata: { shopDomain }
          })
        });

        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        // Standard OAuth flow
        const response = await fetch('/api/oauth/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            provider: providerId
          })
        });

        const data = await response.json();
        
        if (data.type === 'api_key') {
          alert(data.message);
        } else {
          window.location.href = data.authUrl;
        }
      }
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Failed to initiate connection');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (providerId: string) => {
    setSyncing(providerId);
    
    try {
      const response = await fetch(`/api/connections/${userId}/${providerId}/sync`, {
        method: 'POST'
      });

      if (response.ok) {
        alert(`Sync triggered for ${providerId}`);
        // Refresh status after a delay
        setTimeout(fetchConnectionStatus, 5000);
      } else {
        const error = await response.json();
        alert(`Failed to trigger sync: ${error.error}`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to trigger sync');
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    if (!confirm(`Are you sure you want to disconnect ${providerId}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/connections/${userId}/${providerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert(`${providerId} disconnected successfully`);
        fetchConnectionStatus();
      } else {
        const error = await response.json();
        alert(`Failed to disconnect: ${error.error}`);
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
      alert('Failed to disconnect');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Integration Manager</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(provider => (
          <div key={provider.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{provider.icon}</span>
                <h3 className="text-lg font-semibold">{provider.name}</h3>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                provider.connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {provider.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            {provider.connected ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>Records synced: {provider.recordCount || 0}</p>
                  {provider.lastSync && (
                    <p>Last sync: {new Date(provider.lastSync).toLocaleString()}</p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSync(provider.id)}
                    disabled={syncing === provider.id}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    {syncing === provider.id ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(provider.id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleConnect(provider.id)}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Click "Connect" to authorize OpsAI to access your data</li>
          <li>Complete the OAuth flow or enter your API credentials</li>
          <li>Data will automatically sync to your database</li>
          <li>Use "Sync Now" to trigger manual updates</li>
          <li>Access your data through the generated analytics dashboard</li>
        </ol>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold mb-2">Test Credentials:</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>Stripe:</strong> Use test key: sk_test_...</p>
          <p><strong>QuickBooks:</strong> Use sandbox account</p>
          <p><strong>Shopify:</strong> Use development store</p>
        </div>
      </div>
    </div>
  );
};

export default IntegrationManager;