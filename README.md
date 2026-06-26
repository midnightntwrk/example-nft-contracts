# NFT Contracts

This project is built on the [Midnight Network](https://midnight.network/).

[![Generic badge](https://img.shields.io/badge/Compact%20Toolchain-0.31.0-1abc9c.svg)](https://shields.io/) [![Generic badge](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://shields.io/)

Example NFT smart contracts for the Midnight blockchain written in the Compact language (Minokawa). Includes two implementations:

- **NFT** — standard ERC-721-style contract with public on-chain ownership
- **NFT-ZK** — privacy-preserving NFT with hash-based ownership using zero-knowledge proofs

Both contracts follow a modular pattern: the core logic lives in a reusable module (`modules/Nft.compact`, `modules/NftZk.compact`) that you import into your own contract and wrap with whatever authorization you need.

## Project Structure

```
example-nft-contracts/
├── contracts/
│   ├── nft/                         # Public NFT contract
│   │   ├── src/
│   │   │   ├── nft.compact          # Example contract (admin-only mint/burn)
│   │   │   ├── witnesses.ts         # TypeScript witness definitions
│   │   │   ├── modules/Nft.compact  # Reusable NFT module
│   │   │   └── test/                # Unit tests and simulator
│   │   ├── CONTRACT.md
│   │   └── README.md
│   └── nft-zk/                      # Privacy-preserving NFT contract
│       ├── src/
│       │   ├── nft-zk.compact       # Example contract (admin-only mint/burn)
│       │   ├── witnesses.ts         # TypeScript witness definitions
│       │   ├── modules/NftZk.compact # Reusable NFT-ZK module
│       │   └── test/                # Unit tests and simulator
│       ├── CONTRACT.md
│       └── README.md
```

## Prerequisites

- [Node.js v22+](https://nodejs.org/)
- Yarn
- Compact devtools installed and on `PATH`

```bash
# Install the Compact devtools
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh

source $HOME/.local/bin/env

# Install the toolchain version used by this project
compact update 0.31.0
```

## Quick Start

```bash
# Install dependencies
yarn install

# Compile contracts and run tests
yarn test:compile
```

Running `yarn compact` and `yarn test` separately is also supported.

## Using as a Module

Add this repository as a dependency:

```json
{
  "dependencies": {
    "@midnight-ntwrk/example-nft-contracts": "github:midnightntwrk/example-nft-contracts"
  }
}
```

The canonical import path consumers use is `@midnight-ntwrk/example-nft-contracts/contracts/nft/src/modules/Nft` (and `.../contracts/nft-zk/src/modules/NftZk` for the ZK variant).

Then import the module in your Compact contract:

```compact
pragma language_version >= 0.22.0;

import CompactStandardLibrary;
import "@midnight-ntwrk/example-nft-contracts/contracts/nft/src/modules/Nft";

// Export the circuits you want to expose
export {
  balanceOf,
  ownerOf,
  approve,
  getApproved,
  setApprovalForAll,
  isApprovedForAll,
  transfer,
  transferFrom
};

struct AdminSecretKey { bytes: Bytes<32>; }
struct AdminPublicKey { bytes: Bytes<32>; }

export ledger contractAdmin: AdminPublicKey;

witness localSecretKey(): AdminSecretKey;

constructor() {
  contractAdmin = disclose(deriveAdminPublicKey(localSecretKey()));
}

export circuit deriveAdminPublicKey(sk: AdminSecretKey): AdminPublicKey {
  return AdminPublicKey {
    bytes: persistentHash<Vector<2, Bytes<32>>>([pad(32, "nft:admin:pk:v1"), sk.bytes])
  };
}

// Wrap mint/burn with your own authorization
export circuit mintAdmin(to: ZswapCoinPublicKey, tokenId: Uint<64>): [] {
  assert(contractAdmin == deriveAdminPublicKey(localSecretKey()), "Not authorized.");
  mint(to, tokenId);
}
```

For the privacy-preserving version, import `NftZk` instead:

```compact
import "@midnight-ntwrk/example-nft-contracts/contracts/nft-zk/src/modules/NftZk";
```

The Compact compiler resolves package imports by searching directories in `COMPACT_PATH`. Make sure your compile script includes `node_modules`:

```bash
COMPACT_PATH=$COMPACT_PATH:./node_modules compact compile mycontract.compact output/dir
```

## License

Apache-2.0 — see [LICENSE](LICENSE).
