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

import {
  Contract as ContractType,
  Ledger,
  Witnesses
} from "../../managed/nft-zk/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type Contract<T, W extends Witnesses<T> = Witnesses<T>> = ContractType<
  T,
  W
>;

// Private state for the NFT-ZK contract.
//
//   local_secret    : per-user secret for self-operations (NftZk module).
//   shared_secret   : per-user secret for operations with other parties.
//   adminSecretKey  : deployer-only private key. The contract derives the
//                     corresponding public key and stores it on the ledger.
//                     Kept separate from the per-user secrets so the admin
//                     role and ownership identity stay independent.
export type NftZkPrivateState = {
  readonly local_secret: Uint8Array;
  readonly shared_secret: Uint8Array;
  readonly adminSecretKey: Uint8Array;
};

export function createNftZkPrivateState(
  local_secret: Uint8Array,
  shared_secret: Uint8Array,
  adminSecretKey: Uint8Array
): NftZkPrivateState {
  return { local_secret, shared_secret, adminSecretKey };
}

export const witnesses = {
  getLocalSecret: ({
    privateState
  }: WitnessContext<Ledger, NftZkPrivateState>): [
    NftZkPrivateState,
    Uint8Array
  ] => {
    if (privateState.local_secret) {
      return [privateState, privateState.local_secret];
    }
    throw new Error("No local secret found.");
  },
  getSharedSecret: ({
    privateState
  }: WitnessContext<Ledger, NftZkPrivateState>): [
    NftZkPrivateState,
    Uint8Array
  ] => {
    if (privateState.shared_secret) {
      return [privateState, privateState.shared_secret];
    }
    throw new Error("No shared secret found.");
  },
  getAdminSecret: ({
    privateState
  }: WitnessContext<Ledger, NftZkPrivateState>): [
    NftZkPrivateState,
    { bytes: Uint8Array }
  ] => {
    if (privateState.adminSecretKey) {
      return [privateState, { bytes: privateState.adminSecretKey }];
    }
    throw new Error("No admin secret key found.");
  }
};
