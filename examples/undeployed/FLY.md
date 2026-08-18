<!--
  This file is part of midnightntwrk/example-nft-contracts.
  Copyright (C) Midnight Foundation
  SPDX-License-Identifier: Apache-2.0
-->

# Host NFT-ZK Undeployed on Fly.io

This is the same Undeployed network as local Docker (`networkId: undeployed`, genesis seed `…0002`), hosted so a phone or a CI job can reach it without Docker Desktop.

## Why the proof server must be public HTTPS

The `midnightntwrk/proof-server` binary listens on IPv4 only. Fly's private network (6PN) is IPv6-only. If you point midnight-js at `http://nft-undeployed-proof.internal:6300`, prove requests never connect.

fly-proxy terminates public HTTPS and forwards to the machine over IPv4, so the stock binary works with no socat sidecar. Keep the node on 6PN-internal; proxy it when you deploy from a laptop.

| App | Public? | Why |
| --- | --- | --- |
| `nft-undeployed-node` | 6PN-internal | chain RPC should not be on the internet |
| `nft-undeployed-indexer` | HTTPS + WSS | GraphQL for midnight-js |
| `nft-undeployed-proof` | HTTPS | IPv4-only binary behind fly-proxy; 2 GB RAM; never auto-stop |

## Bootstrap

```bash
export FLY_API_TOKEN=FlyV1...   # https://fly.io/user/personal_access_tokens
export FLY_ORG=personal
./scripts/fly-bootstrap.sh
```

## Deploy and mint against Fly

In one terminal:

```bash
flyctl proxy 9944:9944 -a nft-undeployed-node
```

In another:

```bash
yarn compact

MIDNIGHT_INDEXER_URL=https://nft-undeployed-indexer.fly.dev/api/v4/graphql \
MIDNIGHT_PROOF_SERVER_URL=https://nft-undeployed-proof.fly.dev \
MIDNIGHT_NODE_URL=http://127.0.0.1:9944 \
yarn undeployed:deploy

MIDNIGHT_INDEXER_URL=https://nft-undeployed-indexer.fly.dev/api/v4/graphql \
MIDNIGHT_PROOF_SERVER_URL=https://nft-undeployed-proof.fly.dev \
MIDNIGHT_NODE_URL=http://127.0.0.1:9944 \
yarn undeployed:mint
```

`mintAdmin` still requires the constructor admin key stored in `.undeployed-state.json`. A non-empty hash is not authorization.

## Image tags

Pinned to the same tags as [midnight-local-dev `standalone.yml`](https://github.com/midnightntwrk/midnight-local-dev/blob/main/standalone.yml):

- `midnightntwrk/midnight-node:1.0.0`
- `midnightntwrk/indexer-standalone:4.3.3`
- `midnightntwrk/proof-server:8.1.0`
