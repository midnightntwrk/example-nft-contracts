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

import { setTimeout as delay } from "node:timers/promises";
import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { isRetryableDeployError } from "./network.js";
import { buildCompiledNftZk, buildUndeployedProviders } from "./providers.js";
import {
  privateStateFromSecrets,
  readUndeployedState,
  writeUndeployedState
} from "./state.js";

async function main(): Promise<void> {
  const state = await readUndeployedState().catch(() => {
    throw new Error("No undeployed state found. Run: yarn undeployed:deploy");
  });

  const tokenId = BigInt(process.env.NFT_TOKEN_ID ?? state.lastTokenId ?? "1");
  const compiledContract = buildCompiledNftZk();
  const { providers, wallet, coinPublicKey, network } =
    await buildUndeployedProviders();

  await providers.privateStateProvider.setContractAddress(
    state.contractAddress
  );

  const found = await findDeployedContract(providers, {
    compiledContract,
    contractAddress: state.contractAddress,
    privateStateId: state.privateStateId,
    initialPrivateState: privateStateFromSecrets(state)
  } as never);

  console.log(
    `Minting token ${tokenId} on ${state.contractAddress} via ${network.indexer}...`
  );
  console.log(
    "Auth: mintAdmin asserts contractAdmin == deriveAdminPublicKey(getAdminSecret()). A random secret is not enough."
  );

  const to = { bytes: coinPublicKey };
  let result;
  const maxAttempts = 8;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      result = await found.callTx.mintAdmin(to, tokenId);
      break;
    } catch (e) {
      if (isRetryableDeployError(e) && attempt < maxAttempts) {
        const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
        console.warn(
          `Mint attempt ${attempt}/${maxAttempts} failed (${msg}); retrying in 10s...`
        );
        await delay(10_000);
        continue;
      }
      throw e;
    }
  }

  if (!result) {
    throw new Error("Mint failed after retries.");
  }

  const txId = (result.public.txId ?? result.public.txHash) as
    | string
    | undefined;

  await writeUndeployedState({
    ...state,
    lastTokenId: tokenId.toString(),
    lastMintTx: txId
  });

  console.log("\n=== NFT-ZK MINT SUCCESS ===");
  console.log(`Token id:  ${tokenId.toString()}`);
  if (txId) console.log(`Mint tx:   ${txId}`);

  await wallet.stop();
}

main().catch((err: unknown) => {
  console.error("\nMint failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
