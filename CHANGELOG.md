# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0]

### Changed

- Pinned all Midnight dependencies to exact versions (no carets); Midnight packages float onto untested versions, so they are bumped deliberately.
- Bumped `@midnight-ntwrk/midnight-js-network-id` and `@midnight-ntwrk/midnight-js-utils` to `4.1.1`.

### Removed

- Dropped the direct `@midnight-ntwrk/ledger-v8` dependency. Ledger values are available transitively via `@midnight-ntwrk/midnight-js-protocol`; consumers that need them import from `@midnight-ntwrk/midnight-js-protocol/ledger`.
- Dropped the direct `@midnight-ntwrk/wallet-sdk-address-format` dependency. It is unused in this contracts-only repo and remains available transitively if needed.
- Removed `"private": true` so the package can be published or consumed without a publish guard.

### Added

- Added `"files": ["contracts"]` so contract sources ship to consumers (for example, `example-kitties`) as a git dependency.
- Documented the canonical consumer import path in the README.

## [0.2.0]

### Changed

- Replaced the `ownPublicKey()` admin pattern in both example wrapper contracts with a witness-derived public key. The deployer's DApp generates an admin private key and stores it in private state; the contract stores only the derived public key on the ledger, so the deployer's wallet identity is never written on-chain.
- Added `rotateAdmin` to both wrapper contracts so admin authority can be handed off without ever transmitting a private key.
- Bumped `compact-runtime` to `^0.16.0` per the latest [compatibility matrix](https://docs.midnight.network/relnotes/support-matrix).

## [0.1.0]

### Added

- NFT contract module (`tokens/nft`) — ERC721-like NFT with public ownership
- NFT-ZK contract module (`tokens/nft-zk`) — privacy-preserving NFT with hash-based ownership using zero-knowledge proofs
- Full test suites for both contracts (43 tests)
- TypeScript simulators for local contract testing without a running node

### Technical

- Targets ledger v8 (`@midnight-ntwrk/ledger-v8 ^8.0.3`, `compact-runtime ^0.15.0`)
- Compact language version `>= 0.22.0`, compiled with compactc `0.30.0`
