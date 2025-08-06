const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);
const TERRAFORM_DIR = path.join(__dirname, '../../terraform');

async function testTerraformAirbyteIntegration() {
  console.log('🚀 Testing Terraform-Airbyte Integration\n');
  console.log('Terraform directory:', TERRAFORM_DIR);
  console.log('=' .repeat(50));

  try {
    // Step 1: Check Terraform state
    console.log('\n1️⃣ Checking current Terraform state...');
    const { stdout: stateList } = await execAsync(
      'terraform state list | head -20',
      { cwd: TERRAFORM_DIR }
    );
    console.log('Current resources:', stateList || 'No resources found');

    // Step 2: Check which providers are enabled
    console.log('\n2️⃣ Checking enabled providers in tfvars...');
    const tfvarsPath = path.join(TERRAFORM_DIR, 'terraform.tfvars');
    const tfvarsContent = await fs.readFile(tfvarsPath, 'utf8');
    
    const providers = ['stripe', 'github', 'shopify', 'quickbooks'];
    for (const provider of providers) {
      const regex = new RegExp(`${provider}\\s*=\\s*{[^}]*enabled\\s*=\\s*(true|false)`, 's');
      const match = tfvarsContent.match(regex);
      if (match) {
        console.log(`  ${provider}: ${match[1] === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
      }
    }

    // Step 3: Show how to update OAuth credentials
    console.log('\n3️⃣ Example: Updating Stripe credentials...');
    console.log('Current Stripe config:');
    const stripeMatch = tfvarsContent.match(/stripe\s*=\s*{[^}]*}/s);
    if (stripeMatch) {
      console.log(stripeMatch[0]);
    }

    // Step 4: Test Terraform plan (dry run)
    console.log('\n4️⃣ Running Terraform plan to see what would be created...');
    console.log('(This is safe - it only shows what would happen)\n');
    
    const { stdout: planOut } = await execAsync(
      'terraform plan -compact-warnings 2>&1 | head -100',
      { cwd: TERRAFORM_DIR, timeout: 30000 }
    );
    
    // Parse plan output for key information
    if (planOut.includes('No changes')) {
      console.log('✅ Infrastructure is up to date!');
    } else if (planOut.includes('will be created')) {
      console.log('📦 New resources would be created:');
      const creates = planOut.match(/# .+ will be created/g);
      if (creates) {
        creates.forEach(c => console.log('  ', c));
      }
    }

    // Step 5: Show Airbyte connection status
    console.log('\n5️⃣ Checking Airbyte connections...');
    try {
      const { stdout: connections } = await execAsync(
        'terraform state list | grep airbyte_connection',
        { cwd: TERRAFORM_DIR }
      );
      
      if (connections) {
        console.log('Active Airbyte connections:');
        const connList = connections.split('\n').filter(c => c);
        for (const conn of connList) {
          const { stdout: details } = await execAsync(
            `terraform state show ${conn} | grep -E "(provider|status|connection_id)" | head -3`,
            { cwd: TERRAFORM_DIR }
          );
          console.log(`\n  ${conn}:`);
          console.log('  ', details.replace(/\n/g, '\n    '));
        }
      } else {
        console.log('No Airbyte connections found in state');
      }
    } catch (e) {
      console.log('No Airbyte connections configured yet');
    }

    // Step 6: Show how to connect a new provider
    console.log('\n6️⃣ To connect a new provider (e.g., QuickBooks):');
    console.log(`
1. Update terraform.tfvars:
   quickbooks = {
     client_id     = "your-quickbooks-client-id"
     client_secret = "your-quickbooks-access-token"
     enabled       = true
   }

2. Run: terraform plan
3. Run: terraform apply -auto-approve
4. Airbyte will automatically sync data to Supabase!
`);

    // Step 7: Check if we can apply changes
    console.log('7️⃣ Ready to apply changes?');
    console.log('Run: node airbyte-terraform-integration.js');
    console.log('Then use the API to update credentials and apply Terraform');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('No such file or directory')) {
      console.log('\n💡 Make sure you are in the right directory');
      console.log('   Current dir:', process.cwd());
      console.log('   Terraform dir:', TERRAFORM_DIR);
    }
  }
}

// Run the test
testTerraformAirbyteIntegration();