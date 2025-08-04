#!/bin/bash

# Create certificates directory
mkdir -p certificates

# Generate self-signed certificate
openssl req -x509 -out certificates/localhost.crt -keyout certificates/localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")

echo "✅ HTTPS certificates created in ./certificates/"
echo "To use HTTPS, update your package.json script:"
echo 'NODE_OPTIONS="--openssl-legacy-provider" next dev -p 7250 --experimental-https'