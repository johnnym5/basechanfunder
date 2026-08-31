#!/bin/sh
# HashiCorp Vault Initialization Script for Basechanfunder Secrets Engine

echo "Initializing HashiCorp Vault secrets engine..."

export VAULT_ADDR="http://localhost:8200"
export VAULT_TOKEN="root_dev_vault_token"

# Enable KV v2 secrets engine
vault secrets enable -path=secret kv-v2 2>/dev/null || echo "KV v2 engine already enabled"

# Write application secrets
vault kv put secret/basechanfunder/db \
  username="basechan_admin" \
  password="SecureBasechanPassword2026!" \
  database="basechanfunder_db"

vault kv put secret/basechanfunder/oanda \
  api_key="live_or_practice_oanda_token_here" \
  account_id="001-001-1234567-001"

echo "Vault initialization complete!"
