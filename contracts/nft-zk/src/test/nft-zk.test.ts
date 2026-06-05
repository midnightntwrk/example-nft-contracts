// This file is part of midnightntwrk/example-nft-contracts.
// Copyright (C) Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { describe, it, expect } from "vitest";
import { NftZkSimulator } from "./nft-zk-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

setNetworkId("undeployed");

describe("NFT-ZK Contract Tests", () => {
  it("should mint a new token and validate hash key directly", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const aliceOwnerHashKey = simulator.generateLocalUserHashKey(alice);
    simulator.mintAdmin(alice, 1n);
    expect(simulator.ownerOf(1n)).toBe(aliceOwnerHashKey);
    expect(typeof simulator.ownerOf(1n)).toBe("bigint");
    expect(simulator.balanceOf(alice)).toBe(1n);
  });

  it("should handle approvals with explicit hash key validation", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.mintAdmin(alice, 1n);
    const bobOperatorHashKey = simulator.generateSharedUserHashKey(bob);
    simulator.approve(bob, 1n);
    expect(simulator.getApproved(1n)).toBe(bobOperatorHashKey);
    expect(typeof simulator.getApproved(1n)).toBe("bigint");
  });

  it("should handle setApprovalForAll with explicit hash key pairs", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const aliceOwnerHashKey = simulator.generateLocalUserHashKey(alice);
    const bobOperatorHashKey = simulator.generateSharedUserHashKey(bob);
    simulator.setApprovalForAll(bob, true);
    expect(
      simulator.isApprovedForAll(aliceOwnerHashKey, bobOperatorHashKey)
    ).toBe(true);
    simulator.setApprovalForAll(bob, false);
    expect(
      simulator.isApprovedForAll(aliceOwnerHashKey, bobOperatorHashKey)
    ).toBe(false);
  });

  it("should transfer tokens using explicit hash keys", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.mintAdmin(alice, 1n);
    const aliceOwnerHashKey = simulator.ownerOf(1n);
    const bobOperatorHashKey = simulator.generateSharedUserHashKey(bob);
    simulator.transferFrom(aliceOwnerHashKey, bob, 1n);
    expect(simulator.ownerOf(1n)).toBe(bobOperatorHashKey);
    expect(simulator.balanceOf(alice)).toBe(0n);
    expect(simulator.balanceOf(bob)).toBe(1n);
  });

  it("should burn tokens using explicit hash keys", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    simulator.mintAdmin(alice, 1n);
    simulator.burnAdmin(1n);
    expect(simulator.balanceOf(alice)).toBe(0n);
    expect(() => simulator.ownerOf(1n)).toThrow();
  });

  it("should validate hash key generation consistency", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const aliceHash1 = simulator.generateHashKey(
      simulator.publicKeyToBytes(alice).bytes,
      simulator.getLocalSecret()
    );
    const aliceHash2 = simulator.generateHashKey(
      simulator.publicKeyToBytes(alice).bytes,
      simulator.getLocalSecret()
    );
    expect(aliceHash1).toBe(aliceHash2);
    const bobHash1 = simulator.generateHashKey(
      simulator.publicKeyToBytes(bob).bytes,
      simulator.getSharedSecret()
    );
    const bobHash2 = simulator.generateHashKey(
      simulator.publicKeyToBytes(bob).bytes,
      simulator.getSharedSecret()
    );
    expect(bobHash1).toBe(bobHash2);
    const aliceHashWithShared = simulator.generateHashKey(
      simulator.publicKeyToBytes(alice).bytes,
      simulator.getSharedSecret()
    );
    expect(aliceHash1).not.toBe(aliceHashWithShared);
  });

  it("should handle complex approval scenarios with explicit hash management", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const charlie = simulator.createPublicKey("Charlie");
    simulator.mintAdmin(alice, 1n);
    const aliceOwnerHashKey = simulator.generateLocalUserHashKey(alice);
    const bobOperatorHashKey = simulator.generateSharedUserHashKey(bob);
    const charlieTransferredHashKey =
      simulator.generateSharedUserHashKey(charlie);
    simulator.setApprovalForAll(bob, true);
    simulator.approve(charlie, 1n);
    expect(
      simulator.isApprovedForAll(aliceOwnerHashKey, bobOperatorHashKey)
    ).toBe(true);
    expect(simulator.getApproved(1n)).toBe(
      simulator.generateSharedUserHashKey(charlie)
    );
    const aliceCurrentOwnerHash = simulator.ownerOf(1n);
    simulator.transferFrom(aliceCurrentOwnerHash, charlie, 1n);
    expect(simulator.ownerOf(1n)).toBe(charlieTransferredHashKey);
    expect(() => simulator.getApproved(1n)).toThrow();
  });

  it("should mint multiple tokens with different IDs", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const aliceOwnerHashKey = simulator.generateLocalUserHashKey(alice);
    const bobOperatorHashKey = simulator.generateSharedUserHashKey(bob);
    simulator.mintAdmin(alice, 1n);
    simulator.mintAdmin(bob, 2n);
    simulator.mintAdmin(alice, 3n);
    expect(simulator.ownerOf(1n)).toBe(aliceOwnerHashKey);
    expect(simulator.ownerOf(2n)).toBe(bobOperatorHashKey);
    expect(simulator.ownerOf(3n)).toBe(aliceOwnerHashKey);
    expect(simulator.balanceOf(alice)).toBe(2n);
    expect(simulator.balanceOf(bob)).toBe(1n);
  });

  it("should handle non-existent tokens correctly", () => {
    const simulator = new NftZkSimulator();
    expect(() => simulator.ownerOf(999n)).toThrow();
    expect(() => simulator.burnAdmin(999n)).toThrow();
  });

  it("should prevent minting duplicate token IDs", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.mintAdmin(alice, 1n);
    expect(() => simulator.mintAdmin(bob, 1n)).toThrow();
  });

  it("should clear approvals on transfer", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const charlie = simulator.createPublicKey("Charlie");
    simulator.mintAdmin(alice, 1n);
    simulator.approve(bob, 1n);
    expect(simulator.getApproved(1n)).toBe(
      simulator.generateSharedUserHashKey(bob)
    );
    const aliceOwnerHashKey = simulator.ownerOf(1n);
    simulator.transferFrom(aliceOwnerHashKey, charlie, 1n);
    expect(() => simulator.getApproved(1n)).toThrow();
  });

  it("should clear approvals on burn", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.mintAdmin(alice, 1n);
    simulator.approve(bob, 1n);
    expect(simulator.getApproved(1n)).toBe(
      simulator.generateSharedUserHashKey(bob)
    );
    simulator.burnAdmin(1n);
    expect(() => simulator.ownerOf(1n)).toThrow();
    expect(() => simulator.getApproved(1n)).toThrow();
  });

  it("should not allow approving yourself", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    simulator.mintAdmin(alice, 1n);
    expect(() => simulator.approve(alice, 1n)).toThrow();
  });

  it("should not allow setting yourself as operator", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    expect(() => simulator.setApprovalForAll(alice, true)).toThrow();
  });

  it("should handle zero balance correctly", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    expect(simulator.balanceOf(alice)).toBe(0n);
  });

  it("should maintain correct balances after multiple operations", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.mintAdmin(alice, 1n);
    simulator.mintAdmin(alice, 2n);
    simulator.mintAdmin(alice, 3n);
    expect(simulator.balanceOf(alice)).toBe(3n);
    simulator.transferFrom(simulator.ownerOf(1n), bob, 1n);
    expect(simulator.balanceOf(alice)).toBe(2n);
    expect(simulator.balanceOf(bob)).toBe(1n);
    simulator.burnAdmin(2n);
    expect(simulator.balanceOf(alice)).toBe(1n);
    simulator.burnAdmin(1n);
    expect(simulator.balanceOf(bob)).toBe(0n);
  });

  it("should handle operator approvals correctly", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const charlie = simulator.createPublicKey("Charlie");
    const aliceOwnerHashKey = simulator.generateLocalUserHashKey(alice);
    const bobOperatorHashKey = simulator.generateSharedUserHashKey(bob);
    const charlieOperatorHashKey = simulator.generateSharedUserHashKey(charlie);
    expect(
      simulator.isApprovedForAll(aliceOwnerHashKey, bobOperatorHashKey)
    ).toBe(false);
    simulator.setApprovalForAll(bob, true);
    expect(
      simulator.isApprovedForAll(aliceOwnerHashKey, bobOperatorHashKey)
    ).toBe(true);
    expect(
      simulator.isApprovedForAll(aliceOwnerHashKey, charlieOperatorHashKey)
    ).toBe(false);
    simulator.setApprovalForAll(bob, false);
    expect(
      simulator.isApprovedForAll(aliceOwnerHashKey, bobOperatorHashKey)
    ).toBe(false);
  });

  it("should handle large token IDs and edge values", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const largeTokenId = 18446744073709551615n;
    simulator.mintAdmin(alice, largeTokenId);
    expect(typeof simulator.ownerOf(largeTokenId)).toBe("bigint");
    expect(simulator.balanceOf(alice)).toBe(1n);
    simulator.mintAdmin(alice, 1n);
    expect(typeof simulator.ownerOf(1n)).toBe("bigint");
    expect(simulator.balanceOf(alice)).toBe(2n);
  });

  it("should handle sequential minting and burning operations", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const aliceOwnerHashKey = simulator.generateLocalUserHashKey(alice);
    const bobOperatorHashKey = simulator.generateSharedUserHashKey(bob);
    for (let i = 1n; i <= 5n; i++) simulator.mintAdmin(alice, i);
    expect(simulator.balanceOf(alice)).toBe(5n);
    simulator.transferFrom(simulator.ownerOf(1n), bob, 1n);
    simulator.transferFrom(simulator.ownerOf(3n), bob, 3n);
    simulator.transferFrom(simulator.ownerOf(5n), bob, 5n);
    expect(simulator.balanceOf(alice)).toBe(2n);
    expect(simulator.balanceOf(bob)).toBe(3n);
    simulator.burnAdmin(2n);
    simulator.burnAdmin(1n);
    expect(simulator.balanceOf(alice)).toBe(1n);
    expect(simulator.balanceOf(bob)).toBe(2n);
    expect(simulator.ownerOf(4n)).toBe(aliceOwnerHashKey);
    expect(simulator.ownerOf(3n)).toBe(bobOperatorHashKey);
    expect(simulator.ownerOf(5n)).toBe(bobOperatorHashKey);
  });

  it("should correctly handle mixed approval types in transfer scenarios", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const charlie = simulator.createPublicKey("Charlie");
    const dave = simulator.createPublicKey("Dave");
    simulator.mintAdmin(alice, 1n);
    simulator.mintAdmin(alice, 2n);
    const daveOperatorHashKey = simulator.generateSharedUserHashKey(dave);
    simulator.setApprovalForAll(bob, true);
    simulator.approve(charlie, 1n);
    simulator.transferFrom(simulator.ownerOf(2n), dave, 2n);
    expect(simulator.ownerOf(2n)).toBe(daveOperatorHashKey);
    simulator.transferFrom(simulator.ownerOf(1n), dave, 1n);
    expect(simulator.ownerOf(1n)).toBe(daveOperatorHashKey);
    expect(simulator.balanceOf(alice)).toBe(0n);
    expect(simulator.balanceOf(dave)).toBe(2n);
  });

  it("should handle rapid approval changes correctly", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const charlie = simulator.createPublicKey("Charlie");
    simulator.mintAdmin(alice, 1n);
    const aliceOwnerHashKey = simulator.generateLocalUserHashKey(alice);
    const bobOperatorHashKey = simulator.generateSharedUserHashKey(bob);
    const charlieOperatorHashKey = simulator.generateSharedUserHashKey(charlie);
    simulator.approve(bob, 1n);
    expect(simulator.getApproved(1n)).toBe(bobOperatorHashKey);
    simulator.approve(charlie, 1n);
    expect(simulator.getApproved(1n)).toBe(charlieOperatorHashKey);
    simulator.approve(bob, 1n);
    expect(simulator.getApproved(1n)).toBe(bobOperatorHashKey);
    simulator.setApprovalForAll(charlie, true);
    expect(
      simulator.isApprovedForAll(aliceOwnerHashKey, charlieOperatorHashKey)
    ).toBe(true);
    simulator.setApprovalForAll(charlie, false);
    expect(
      simulator.isApprovedForAll(aliceOwnerHashKey, charlieOperatorHashKey)
    ).toBe(false);
    simulator.setApprovalForAll(charlie, true);
    expect(
      simulator.isApprovedForAll(aliceOwnerHashKey, charlieOperatorHashKey)
    ).toBe(true);
  });

  it("should test transfer circuit functionality", () => {
    const simulator = new NftZkSimulator();
    const alice = simulator.createPublicKey("Alice");
    const charlie = simulator.createPublicKey("Charlie");
    const charlieOperatorHashKey = simulator.generateSharedUserHashKey(charlie);
    simulator.mintAdmin(alice, 1n);
    simulator.transfer(charlie, 1n);
    const charlieFirstTokenHash = simulator.ownerOf(1n);
    simulator.mintAdmin(alice, 2n);
    simulator.transfer(charlie, 2n);
    const charlieSecondTokenHash = simulator.ownerOf(2n);
    expect(charlieFirstTokenHash).toBe(charlieSecondTokenHash);
    expect(charlieFirstTokenHash).toBe(charlieOperatorHashKey);
    expect(simulator.balanceOf(alice)).toBe(0n);
    expect(simulator.balanceOf(charlie)).toBe(2n);
  });
});
