#!/usr/bin/env python3
import requests
import json
from requests.auth import HTTPBasicAuth

# Read credentials from terraform.tfvars
client_id = "4af7a574-b155-47ee-8dce-2cd2c519a34a"
client_secret = "qxbgA1QsHSZBfOVqdgjbiNJ1ultXGwz7"

# Get access token using client credentials
token_url = "https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token"
token_data = {
    'grant_type': 'client_credentials',
    'client_id': client_id,
    'client_secret': client_secret
}

print("Getting access token...")
token_response = requests.post(token_url, data=token_data)
if token_response.status_code != 200:
    print(f"Failed to get token: {token_response.text}")
    exit(1)

access_token = token_response.json()['access_token']
print("Got access token!")

# Get source definitions
api_url = "https://api.airbyte.com/v1/source-definitions"
headers = {
    'Authorization': f'Bearer {access_token}',
    'Accept': 'application/json'
}

print("\nFetching source definitions...")
response = requests.get(api_url, headers=headers)

if response.status_code == 200:
    definitions = response.json()
    
    # Filter for the sources we need
    sources_we_need = ['GitHub', 'Google Analytics', 'Calendly', 'Shopify', 'Stripe']
    
    print("\n=== Available Source Definitions ===\n")
    
    for source in definitions.get('data', []):
        name = source.get('name', '')
        # Check if this source matches any we need
        for needed in sources_we_need:
            if needed.lower() in name.lower():
                print(f"Name: {name}")
                print(f"Definition ID: {source.get('sourceDefinitionId')}")
                print(f"Docker Repo: {source.get('dockerRepository', 'N/A')}")
                print(f"Documentation URL: {source.get('documentationUrl', 'N/A')}")
                print("-" * 50)
                break
else:
    print(f"Failed to fetch definitions: {response.status_code}")
    print(response.text)