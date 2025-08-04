// Example: How to handle OAuth and update Terraform

async function connectGitHub(userId) {
  // 1. User goes through GitHub OAuth
  const { access_token } = await githubOAuth.authorize();
  
  // 2. Let user select repositories
  const repos = await github.listRepos(access_token);
  const selectedRepos = await showRepoSelector(repos);
  
  // 3. Update Terraform configuration for this user
  const tfvars = {
    oauth_providers: {
      github: {
        client_secret: access_token,
        enabled: true
      }
    }
  };
  
  // 4. Update the GitHub source with selected repos
  await updateTerraformSource('github', {
    repositories: selectedRepos.map(r => r.full_name)
  });
  
  // 5. Apply Terraform
  await exec('terraform apply -auto-approve');
  
  // Now Airbyte will sync their GitHub data to your Supabase!
}

async function connectGoogleAnalytics(userId) {
  // 1. User goes through Google OAuth
  const { refresh_token } = await googleOAuth.authorize(['analytics.readonly']);
  
  // 2. Let user select GA properties
  const properties = await googleAnalytics.listProperties(refresh_token);
  const selectedProperties = await showPropertySelector(properties);
  
  // 3. Update Terraform with user's credentials
  const tfvars = {
    oauth_providers: {
      google: {
        client_secret: refresh_token,
        enabled: true
      }
    }
  };
  
  // 4. Update the source with their property IDs
  await updateTerraformSource('google_analytics', {
    property_ids: selectedProperties.map(p => p.id),
    refresh_token: refresh_token
  });
  
  // 5. Apply Terraform
  await exec('terraform apply -auto-approve');
}

async function connectShopify(userId) {
  // 1. User goes through Shopify OAuth
  const { shop_domain, access_token } = await shopifyOAuth.authorize();
  
  // 2. Update Terraform
  await updateTerraformSource('shopify', {
    shop: shop_domain,
    access_token: access_token
  });
  
  await exec('terraform apply -auto-approve');
}