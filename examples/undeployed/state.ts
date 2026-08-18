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

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNftZkPrivateState } from "../../contracts/nft-zk/src/witnesses.js";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

export const STATE_PATH = path.join(
  ROOT,
  "examples",
  "undeployed",
  ".undeployed-state.json"
);

export const ZK_CONFIG_PATH = path.join(ROOT, "contracts", "managed", "nft-zk");

export type UndeployedState = {
  contractAddress: string;
  privateStateId: string;
  adminSecretKeyHex: string;
  localSecretHex: string;
  sharedSecretHex: string;
  lastTokenId?: string;
  lastMintTx?: string;
};

export function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

export function hexToBytes(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, "hex"));
}

export function randomSecret(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function privateStateFromSecrets(state: {
  adminSecretKeyHex: string;
  localSecretHex: string;
  sharedSecretHex: string;
}) {
  return createNftZkPrivateState(
    hexToBytes(state.localSecretHex),
    hexToBytes(state.sharedSecretHex),
    hexToBytes(state.adminSecretKeyHex)
  );
}

export async function readUndeployedState(): Promise<UndeployedState> {
  const raw = await readFile(STATE_PATH, "utf8");
  return JSON.parse(raw) as UndeployedState;
}

export async function writeUndeployedState(
  state: UndeployedState
): Promise<void> {
  await mkdir(path.dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}
