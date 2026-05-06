<!--
  This file is part of midnightntwrk/example-nft-contracts.
  Copyright (C) Midnight Foundation
  SPDX-License-Identifier: Apache-2.0
-->

# NFT Contract

A standard ERC-721-style NFT implementation for the Midnight blockchain written in the Compact language (Minokawa). Ownership and approvals are stored on the public ledger.

> For a privacy-preserving alternative, see [NFT-ZK](../nft-zk/).

## Structure

```
contracts/nft/
├── src/
│   ├── nft.compact            # Example contract (admin-only mint/burn)
│   ├── witnesses.ts           # TypeScript witness definitions
│   ├── modules/
│   │   └── Nft.compact        # Reusable NFT module
│   └── test/
│       ├── nft-simulator.ts   # Contract simulator
│       └── nft.test.ts        # Test suite (21 tests)
├── CONTRACT.md
└── README.md
```

## The Modular Pattern

The core NFT logic lives in `modules/Nft.compact`. It exports all circuits with no authorization — `mint`, `burn`, `transfer`, `approve`, etc. The example contract in `nft.compact` imports the module and adds admin-only authorization as a starting point. You decide how to authorize the circuits in your own contract.

## Circuits

| Circuit | Description |
|---|---|
| `balanceOf(owner)` | Number of tokens owned by an address |
| `ownerOf(tokenId)` | Public key of the token owner |
| `approve(to, tokenId)` | Approve an address to transfer a specific token |
| `getApproved(tokenId)` | Get the approved address for a token |
| `setApprovalForAll(operator, approved)` | Set operator approval for all tokens |
| `isApprovedForAll(owner, operator)` | Check operator approval status |
| `transfer(to, tokenId)` | Transfer a token from caller to recipient |
| `transferFrom(sender, to, tokenId)` | Transfer a token between addresses |
| `mint(to, tokenId)` | Create a new token *(module only — wrap with your auth)* |
| `burn(owner, tokenId)` | Destroy a token *(module only — wrap with your auth)* |

## Running Tests

```bash
# From repo root — compile contracts then run tests
yarn test:compile

# If contracts are already compiled
yarn test
```

## License

Apache-2.0 — see [LICENSE](../../LICENSE).
