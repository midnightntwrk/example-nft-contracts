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
import { access } from "node:fs/promises";
import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { isRetryableDeployError } from "./network.js";
import { buildCompiledNftZk, buildUndeployedProviders } from "./providers.js";
import {
  bytesToHex,
  privateStateFromSecrets,
  randomSecret,
  writeUndeployedState,
  ZK_CONFIG_PATH
} from "./state.js";

async function assertCompiled(): Promise<void> {
  try {
    await access(ZK_CONFIG_PATH);
  } catch {
    throw new Error(
      `Compiled NFT-ZK artefacts not found at ${ZK_CONFIG_PATH}. Run: yarn compact`
    );
  }
}

async function main(): Promise<void> {
  await assertCompiled();

  const adminSecretKey = randomSecret();
  const localSecret = randomSecret();
  const sharedSecret = randomSecret();
  const secrets = {
    adminSecretKeyHex: bytesToHex(adminSecretKey),
    localSecretHex: bytesToHex(localSecret),
    sharedSecretHex: bytesToHex(sharedSecret)
  };
  const initialPrivateState = privateStateFromSecrets(secrets);
  const compiledContract = buildCompiledNftZk();
  const { providers, wallet, network } = await buildUndeployedProviders();

  console.log(`Deploying NFT-ZK to ${network.indexer}...`);
  const privateStateId = `nft-zk-undeployed-${Date.now()}`;
  let deployed;
  const maxAttempts = 8;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      deployed = await deployContract(providers, {
        compiledContract,
        privateStateId,
        initialPrivateState,
        args: []
      } as never);
      break;
    } catch (e) {
      if (isRetryableDeployError(e) && attempt < maxAttempts) {
        const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
        console.warn(
          `Deploy attempt ${attempt}/${maxAttempts} failed (${msg}); retrying in 10s...`
        );
        await delay(10_000);
        continue;
      }
      throw e;
    }
  }

  if (!deployed) {
    throw new Error("Deploy failed after retries.");
  }

  const contractAddress = deployed.deployTxData.public
    .contractAddress as string;
  const txHash = (deployed.deployTxData.public.txHash ??
    deployed.deployTxData.public.txId) as string | undefined;

  const onChain =
    await providers.publicDataProvider.queryContractState(contractAddress);
  if (!onChain) {
    throw new Error("Contract state not found on indexer after deployment.");
  }

  await writeUndeployedState({
    contractAddress,
    privateStateId,
    ...secrets
  });

  console.log("\n=== NFT-ZK DEPLOY SUCCESS ===");
  console.log(`Network:          undeployed`);
  console.log(`Contract address: ${contractAddress}`);
  if (txHash) console.log(`Deploy tx:        ${txHash}`);
  console.log(
    `Admin key:        stored in examples/undeployed/.undeployed-state.json (gitignored)`
  );
  console.log("Mint with:        yarn undeployed:mint");

  await wallet.stop();
}

main().catch((err: unknown) => {
  console.error(
    "\nDeployment failed:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
});
