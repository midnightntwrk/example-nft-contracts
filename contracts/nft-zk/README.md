<!--
  This file is part of midnightntwrk/example-nft-contracts.
  Copyright (C) Midnight Foundation
  SPDX-License-Identifier: Apache-2.0
-->

# NFT-ZK Contract

A privacy-preserving ERC-721-style NFT implementation for the Midnight blockchain written in the Compact language (Minokawa). Ownership is hidden behind cryptographic hash keys instead of public addresses.

> For a simpler public alternative, see [NFT](../nft/).

## Structure

```
contracts/nft-zk/
├── src/
│   ├── nft-zk.compact             # Example contract (admin-only mint/burn)
│   ├── witnesses.ts               # TypeScript witness definitions
│   ├── modules/
│   │   └── NftZk.compact          # Reusable NFT-ZK module
│   └── test/
│       ├── nft-zk-simulator.ts    # Contract simulator
│       └── nft-zk.test.ts         # Test suite (22 tests)
├── CONTRACT.md
└── README.md
```

## The Modular Pattern

The core NFT-ZK logic lives in `modules/NftZk.compact`. It exports all circuits with no authorization. The example contract in `nft-zk.compact` imports the module and adds admin-only authorization as a starting point. You decide how to authorize the circuits in your own contract.

## Privacy Model

Token ownership is stored as `hash(publicKey, secret)` rather than a raw public key. The contract uses two secrets:

- **Local secret** — for self-operations (minting to yourself, checking your own balance)
- **Shared secret** — for operations involving other parties (transfers, approvals)

This means token ownership on the public ledger is a hash commitment, not an address anyone can link back to you.

## Circuits

| Circuit | Description |
|---|---|
| `balanceOf(owner)` | Token count for an address (computed privately) |
| `ownerOf(tokenId)` | Hash key of the token owner |
| `approve(to, tokenId)` | Approve an address for a specific token |
| `getApproved(tokenId)` | Get the approved hash key for a token |
| `setApprovalForAll(operator, approved)` | Set operator approval for all tokens |
| `isApprovedForAll(ownerHashKey, operatorHashKey)` | Check operator approval between hash keys |
| `transfer(to, tokenId)` | Transfer a token from caller to recipient |
| `transferFrom(fromHashKey, to, tokenId)` | Transfer a token using explicit hash key |
| `generateHashKey(pk, secret)` | Compute a hash key from a public key and secret |
| `mint(to, tokenId)` | Create a new token *(module only — wrap with your auth)* |
| `burn(ownerHashKey, tokenId)` | Destroy a token *(module only — wrap with your auth)* |

## Running Tests

```bash
# From repo root — compile contracts then run tests
yarn test:compile

# If contracts are already compiled
yarn test
```

## License

Apache-2.0 — see [LICENSE](../../LICENSE).
