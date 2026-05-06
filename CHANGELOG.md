# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0]

### Added
- NFT contract module (`tokens/nft`) — ERC721-like NFT with public ownership
- NFT-ZK contract module (`tokens/nft-zk`) — privacy-preserving NFT with hash-based ownership using zero-knowledge proofs
- Full test suites for both contracts (43 tests)
- TypeScript simulators for local contract testing without a running node

### Technical
- Targets ledger v8 (`@midnight-ntwrk/ledger-v8 ^8.0.3`, `compact-runtime ^0.15.0`)
- Compact language version `>= 0.22.0`, compiled with compactc `0.30.0`
