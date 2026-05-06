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
import { NftSimulator } from "./nft-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

setNetworkId("undeployed");

describe("NFT Contract Tests", () => {
  it("should mint a new token", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    simulator.mintAdmin(alice, 1n);
    expect(simulator.ownerOf(1n)).toBe(alice);
    expect(simulator.balanceOf(alice)).toBe(1n);
  });

  it("should transfer token between users", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.mintAdmin(alice, 1n);
    simulator.transferFrom(alice, bob, 1n);
    expect(simulator.ownerOf(1n)).toBe(bob);
    expect(simulator.balanceOf(alice)).toBe(0n);
    expect(simulator.balanceOf(bob)).toBe(1n);
  });

  it("should approve and get approved address", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.mintAdmin(alice, 1n);
    simulator.approve(bob, 1n);
    expect(simulator.getApproved(1n)).toBe(bob);
  });

  it("should set approval for all", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.setApprovalForAll(bob, true);
    expect(simulator.isApprovedForAll(alice, bob)).toBe(true);
  });

  it("should burn a token", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    simulator.mintAdmin(alice, 1n);
    simulator.burnAdmin(1n);
    expect(simulator.balanceOf(alice)).toBe(0n);
    expect(() => simulator.ownerOf(1n)).toThrow();
  });

  it("should mint multiple tokens with different IDs", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.mintAdmin(alice, 1n);
    simulator.mintAdmin(bob, 2n);
    simulator.mintAdmin(alice, 3n);
    expect(simulator.ownerOf(1n)).toBe(alice);
    expect(simulator.ownerOf(2n)).toBe(bob);
    expect(simulator.ownerOf(3n)).toBe(alice);
    expect(simulator.balanceOf(alice)).toBe(2n);
    expect(simulator.balanceOf(bob)).toBe(1n);
  });

  it("should handle non-existent tokens correctly", () => {
    const simulator = new NftSimulator();
    expect(() => simulator.ownerOf(999n)).toThrow();
    expect(() => simulator.burnAdmin(999n)).toThrow();
  });

  it("should prevent minting duplicate token IDs", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.mintAdmin(alice, 1n);
    expect(() => simulator.mintAdmin(bob, 1n)).toThrow();
  });

  it("should clear approvals on transfer", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const charlie = simulator.createPublicKey("Charlie");
    simulator.mintAdmin(alice, 1n);
    simulator.approve(bob, 1n);
    expect(simulator.getApproved(1n)).toBe(bob);
    simulator.transferFrom(alice, charlie, 1n);
    expect(() => simulator.getApproved(1n)).toThrow();
  });

  it("should clear approvals on burn", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.mintAdmin(alice, 1n);
    simulator.approve(bob, 1n);
    expect(simulator.getApproved(1n)).toBe(bob);
    simulator.burnAdmin(1n);
    expect(() => simulator.ownerOf(1n)).toThrow();
    expect(() => simulator.getApproved(1n)).toThrow();
  });

  it("should not allow approving yourself", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    simulator.mintAdmin(alice, 1n);
    expect(() => simulator.approve(alice, 1n)).toThrow();
  });

  it("should not allow setting yourself as operator", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    expect(() => simulator.setApprovalForAll(alice, true)).toThrow();
  });

  it("should handle zero balance correctly", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    expect(simulator.balanceOf(alice)).toBe(0n);
  });

  it("should maintain correct balances after multiple operations", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    simulator.mintAdmin(alice, 1n);
    simulator.mintAdmin(alice, 2n);
    simulator.mintAdmin(alice, 3n);
    expect(simulator.balanceOf(alice)).toBe(3n);
    simulator.transferFrom(alice, bob, 1n);
    expect(simulator.balanceOf(alice)).toBe(2n);
    expect(simulator.balanceOf(bob)).toBe(1n);
    simulator.burnAdmin(2n);
    expect(simulator.balanceOf(alice)).toBe(1n);
    simulator.burnAdmin(1n);
    expect(simulator.balanceOf(bob)).toBe(0n);
  });

  it("should handle operator approvals correctly", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const charlie = simulator.createPublicKey("Charlie");
    expect(simulator.isApprovedForAll(alice, bob)).toBe(false);
    simulator.setApprovalForAll(bob, true);
    expect(simulator.isApprovedForAll(alice, bob)).toBe(true);
    expect(simulator.isApprovedForAll(alice, charlie)).toBe(false);
    simulator.setApprovalForAll(bob, false);
    expect(simulator.isApprovedForAll(alice, bob)).toBe(false);
  });

  it("should handle complex approval and transfer scenarios", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const charlie = simulator.createPublicKey("Charlie");
    simulator.mintAdmin(alice, 1n);
    simulator.setApprovalForAll(bob, true);
    simulator.approve(charlie, 1n);
    expect(simulator.isApprovedForAll(alice, bob)).toBe(true);
    expect(simulator.getApproved(1n)).toBe(charlie);
    simulator.transferFrom(alice, charlie, 1n);
    expect(simulator.ownerOf(1n)).toBe(charlie);
    expect(simulator.isApprovedForAll(alice, bob)).toBe(true);
    expect(() => simulator.getApproved(1n)).toThrow();
  });

  it("should handle large token IDs and edge values", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const largeTokenId = 18446744073709551615n;
    simulator.mintAdmin(alice, largeTokenId);
    expect(simulator.ownerOf(largeTokenId)).toBe(alice);
    expect(simulator.balanceOf(alice)).toBe(1n);
    simulator.mintAdmin(alice, 1n);
    expect(simulator.ownerOf(1n)).toBe(alice);
    expect(simulator.balanceOf(alice)).toBe(2n);
  });

  it("should handle sequential minting and burning operations", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    for (let i = 1n; i <= 5n; i++) simulator.mintAdmin(alice, i);
    expect(simulator.balanceOf(alice)).toBe(5n);
    simulator.transferFrom(alice, bob, 1n);
    simulator.transferFrom(alice, bob, 3n);
    simulator.transferFrom(alice, bob, 5n);
    expect(simulator.balanceOf(alice)).toBe(2n);
    expect(simulator.balanceOf(bob)).toBe(3n);
    simulator.burnAdmin(2n);
    simulator.burnAdmin(1n);
    expect(simulator.balanceOf(alice)).toBe(1n);
    expect(simulator.balanceOf(bob)).toBe(2n);
    expect(simulator.ownerOf(4n)).toBe(alice);
    expect(simulator.ownerOf(3n)).toBe(bob);
    expect(simulator.ownerOf(5n)).toBe(bob);
  });

  it("should correctly handle mixed approval types in transfer scenarios", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const charlie = simulator.createPublicKey("Charlie");
    const dave = simulator.createPublicKey("Dave");
    simulator.mintAdmin(alice, 1n);
    simulator.mintAdmin(alice, 2n);
    simulator.setApprovalForAll(bob, true);
    simulator.approve(charlie, 1n);
    simulator.transferFrom(alice, dave, 2n);
    expect(simulator.ownerOf(2n)).toBe(dave);
    simulator.transferFrom(alice, dave, 1n);
    expect(simulator.ownerOf(1n)).toBe(dave);
    expect(simulator.balanceOf(alice)).toBe(0n);
    expect(simulator.balanceOf(dave)).toBe(2n);
  });

  it("should handle rapid approval changes correctly", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const bob = simulator.createPublicKey("Bob");
    const charlie = simulator.createPublicKey("Charlie");
    simulator.mintAdmin(alice, 1n);
    simulator.approve(bob, 1n);
    expect(simulator.getApproved(1n)).toBe(bob);
    simulator.approve(charlie, 1n);
    expect(simulator.getApproved(1n)).toBe(charlie);
    simulator.approve(bob, 1n);
    expect(simulator.getApproved(1n)).toBe(bob);
    simulator.setApprovalForAll(charlie, true);
    expect(simulator.isApprovedForAll(alice, charlie)).toBe(true);
    simulator.setApprovalForAll(charlie, false);
    expect(simulator.isApprovedForAll(alice, charlie)).toBe(false);
    simulator.setApprovalForAll(charlie, true);
    expect(simulator.isApprovedForAll(alice, charlie)).toBe(true);
  });

  it("should test transfer circuit functionality", () => {
    const simulator = new NftSimulator();
    const alice = simulator.createPublicKey("Alice");
    const charlie = simulator.createPublicKey("Charlie");
    simulator.mintAdmin(alice, 1n);
    simulator.transfer(charlie, 1n);
    const charlieFirstToken = simulator.ownerOf(1n);
    simulator.mintAdmin(alice, 2n);
    simulator.transfer(charlie, 2n);
    const charlieSecondToken = simulator.ownerOf(2n);
    expect(charlieFirstToken).toBe(charlieSecondToken);
    expect(charlieFirstToken).toBe(charlie);
    expect(simulator.balanceOf(alice)).toBe(0n);
    expect(simulator.balanceOf(charlie)).toBe(2n);
  });
});
