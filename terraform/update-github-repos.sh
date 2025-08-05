#!/bin/bash

# Update GitHub repositories in Terraform based on user's actual repos

echo "🔧 Updating Terraform configuration with user's GitHub repositories..."

# Get the user's actual GitHub repositories using the token from integrations
GITHUB_TOKEN=$(node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://dqmufpexuuvlulpilirt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXVmcGV4dXV2bHVscGlsaXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcxNzAwOSwiZXhwIjoyMDY5MjkzMDA5fQ.lNMJPTTGeEA18HSkTYpn87jNcDjIcJEOwDSlOsxZdBU'
);

(async () => {
  const { data } = await supabase
    .from('tenant_integrations')
    .select('access_token')
    .eq('tenant_id', 'default')
    .eq('provider', 'github')
    .eq('status', 'connected')
    .order('connected_at', { ascending: false })
    .limit(1)
    .single();
  
  if (data && data.access_token) {
    console.log(data.access_token);
  }
})().catch(() => {});
")

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ No GitHub token found in database"
  exit 1
fi

echo "✅ Found GitHub token"

# Get user's repositories
echo "📋 Fetching user's repositories..."
REPOS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/user/repos?per_page=10&sort=updated" | jq -r '.[].full_name' | head -5)

if [ -z "$REPOS" ]; then
  echo "❌ No repositories found"
  exit 1
fi

echo "✅ Found repositories:"
echo "$REPOS" | sed 's/^/  - /'

# Create terraform.tfvars.json with the repositories
cat > terraform.tfvars.json <<EOF
{
  "github_repositories": [
$(echo "$REPOS" | awk '{printf "    \"%s\"", $0} END {print ""}' | sed '$ s/,$//')
  ],
  "github_access_token": "$GITHUB_TOKEN"
}
EOF

echo ""
echo "✅ Updated terraform.tfvars.json with user's repositories"
echo ""
echo "Next steps:"
echo "1. Run: terraform plan"
echo "2. Run: terraform apply -auto-approve"
echo ""
echo "This will update the GitHub source to use your actual repositories instead of airbytehq/airbyte"