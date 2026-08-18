<!--
  This file is part of midnightntwrk/example-nft-contracts.
  Copyright (C) Midnight Foundation
  SPDX-License-Identifier: Apache-2.0
-->

# Undeployed deploy and mint (NFT-ZK)

The Compact tests in this repository use the in-memory simulator. This example shows how to **deploy NFT-ZK to a real Undeployed node** and call `mintAdmin` with the same admin-keypair authorization the contract already implements:

```compact
assert(contractAdmin == deriveAdminPublicKey(getAdminSecret()), "Not authorized to mint.");
mint(to, tokenId);
```

`assert(hash != pad(32, ""))` is not access control. The constructor stores `deriveAdminPublicKey(getAdminSecret())`; later circuits must re-derive that key from the witness.

## Prerequisites

- Docker Desktop (`docker info` succeeds)
- Compact toolchain (see the root README)
- Yarn

## Local quick start

```bash
yarn install
yarn compact
yarn undeployed:up
yarn undeployed:deploy
yarn undeployed:mint
```

Or one shot after compile: `yarn undeployed:e2e`.

The deploy script writes `examples/undeployed/.undeployed-state.json` (gitignored) with the contract address and the admin secret. Mint reads that file so the witness matches the constructor key.

## Fly.io

See [FLY.md](./FLY.md). The proof-server binary is IPv4-only; Fly 6PN is IPv6-only. Use the public HTTPS proof URL.
