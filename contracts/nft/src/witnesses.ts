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

import { Ledger } from "../../managed/nft/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

// Private state holds the deployer's admin private key as raw bytes. The
// Compact contract receives it as an AdminSecretKey struct ({ bytes }).
export type NftPrivateState = {
  readonly adminSecretKey: Uint8Array;
};

export const createNftPrivateState = (
  adminSecretKey: Uint8Array
): NftPrivateState => ({
  adminSecretKey
});

export const witnesses = {
  localSecretKey: ({
    privateState
  }: WitnessContext<Ledger, NftPrivateState>): [
    NftPrivateState,
    { bytes: Uint8Array }
  ] => [privateState, { bytes: privateState.adminSecretKey }]
};
