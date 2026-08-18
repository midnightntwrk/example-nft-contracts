#!/usr/bin/env bash
# One-shot bootstrap for a hosted Midnight Undeployed stack on Fly.io.
#
# Requires either `flyctl auth login` or FLY_API_TOKEN / FLY_ACCESS_TOKEN.
# Safe to re-run — every step treats "already exists" as success.
#
# Usage:
#   FLY_API_TOKEN=... FLY_ORG=personal ./scripts/fly-bootstrap.sh
#
# Creates:
#   nft-undeployed-node     (6PN-internal RPC)
#   nft-undeployed-indexer  (public HTTPS + WSS)
#   nft-undeployed-proof    (public HTTPS; IPv4-only binary behind fly-proxy)

set -euo pipefail
cd "$(dirname "$0")/.."

ORG="${FLY_ORG:-personal}"
REGION="${FLY_REGION:-iad}"

if [[ -z "${FLY_ACCESS_TOKEN:-}" && -n "${FLY_API_TOKEN:-}" ]]; then
  export FLY_ACCESS_TOKEN="$FLY_API_TOKEN"
fi

if ! command -v flyctl >/dev/null 2>&1; then
  echo "Installing flyctl…"
  curl -sL https://fly.io/install.sh | sh
  export PATH="$HOME/.fly/bin:$PATH"
fi

flyctl version
echo "==> Verifying auth"
flyctl auth whoami

create_app() {
  local name="$1"
  if flyctl apps list --json | grep -q "\"Name\":\"$name\""; then
    echo "  app $name already exists"
  else
    flyctl apps create "$name" --org "$ORG"
  fi
}

echo "==> Creating apps"
create_app nft-undeployed-node
create_app nft-undeployed-indexer
create_app nft-undeployed-proof

echo "==> Creating node volume"
if ! flyctl volumes list -a nft-undeployed-node --json 2>/dev/null | grep -q '"name":"chain_data"'; then
  flyctl volumes create chain_data -a nft-undeployed-node --region "$REGION" --size 1 --yes
else
  echo "  volume chain_data already exists"
fi

echo "==> Deploying node"
flyctl deploy -c examples/undeployed/fly/node/fly.toml --remote-only --ha=false --wait-timeout=600

echo "==> Deploying indexer"
flyctl deploy -c examples/undeployed/fly/indexer/fly.toml --remote-only --ha=false --wait-timeout=600

echo "==> Deploying proof-server"
flyctl deploy -c examples/undeployed/fly/proof/fly.toml --remote-only --ha=false --wait-timeout=900

echo "==> Pinning to 1 machine each"
for app in nft-undeployed-node nft-undeployed-indexer nft-undeployed-proof; do
  flyctl scale count 1 -a "$app" --yes || true
done

cat <<'EOF'

=== Fly Undeployed stack is up ===

  Indexer:  https://nft-undeployed-indexer.fly.dev/api/v4/graphql
  Proof:    https://nft-undeployed-proof.fly.dev
  Node:     6PN-internal only (ws://nft-undeployed-node.internal:9944)

The proof-server binary is IPv4-only. Fly 6PN is IPv6-only. Always use the
public HTTPS proof URL — do not send prove requests to *.internal.

To deploy NFT-ZK from a laptop, proxy the node then run the same scripts:

  flyctl proxy 9944:9944 -a nft-undeployed-node

  MIDNIGHT_INDEXER_URL=https://nft-undeployed-indexer.fly.dev/api/v4/graphql \
  MIDNIGHT_PROOF_SERVER_URL=https://nft-undeployed-proof.fly.dev \
  MIDNIGHT_NODE_URL=http://127.0.0.1:9944 \
  yarn undeployed:deploy

See examples/undeployed/FLY.md for details.
EOF
