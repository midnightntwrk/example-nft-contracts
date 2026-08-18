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

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { WebSocket } from "ws";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import {
  MidnightWalletProvider,
  createLogger
} from "@midnight-ntwrk/testkit-js";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { Contract } from "../../contracts/managed/nft-zk/contract/index.js";
import { witnesses } from "../../contracts/nft-zk/src/witnesses.js";
import {
  GENESIS_SEED,
  isLocalHost,
  resolveUndeployedNetwork,
  type UndeployedNetwork
} from "./network.js";
import { ZK_CONFIG_PATH } from "./state.js";

const execFileP = promisify(execFile);

globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

export type BuiltProviders = {
  network: UndeployedNetwork;
  // midnight-js provider bag is version-specific; keep this untyped at the edge.
  providers: any;
  wallet: MidnightWalletProvider;
  coinPublicKey: Uint8Array;
};

async function checkContainerHealthy(name: string): Promise<void> {
  try {
    const { stdout } = await execFileP("docker", [
      "inspect",
      name,
      "--format",
      "{{.State.Status}}"
    ]);
    const status = stdout.trim();
    if (status === "restarting" || status === "exited" || status === "dead") {
      throw new Error(
        `Container '${name}' is ${status}. Run: docker compose -f examples/undeployed/docker-compose.yml logs --tail=80`
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Container ")) throw e;
  }
}

export async function waitForService(
  url: string,
  name: string,
  timeoutMs = 120_000,
  containerName?: string
): Promise<void> {
  const start = Date.now();
  console.log(`Waiting for ${name} at ${url}...`);
  while (Date.now() - start < timeoutMs) {
    if (containerName) await checkContainerHealthy(containerName);
    try {
      const resp = await fetch(url, {
        method: name === "indexer" ? "POST" : "GET",
        headers:
          name === "indexer"
            ? { "Content-Type": "application/json" }
            : undefined,
        body:
          name === "indexer"
            ? JSON.stringify({ query: "{ __typename }" })
            : undefined
      });
      if (resp.status < 500) {
        console.log(`${name} is ready.`);
        return;
      }
    } catch {
      // not ready
    }
    await delay(1_000);
  }
  throw new Error(
    `${name} at ${url} did not become ready within ${timeoutMs}ms`
  );
}

export async function waitForBlockHeight(
  indexerUrl: string,
  minHeight: number,
  timeoutMs = 60_000
): Promise<void> {
  const start = Date.now();
  console.log(`Waiting for node to produce block height >= ${minHeight}...`);
  let lastHeight = -1;
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(indexerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "{ block { height } }" })
      });
      const json = (await resp.json()) as {
        data?: { block?: { height?: number } };
      };
      const h = Number(json?.data?.block?.height ?? -1);
      if (h !== lastHeight) {
        console.log(`  current tip height: ${h}`);
        lastHeight = h;
      }
      if (h >= minHeight) {
        console.log(`Node is producing blocks (height ${h}).`);
        return;
      }
    } catch {
      // indexer not fully warm yet
    }
    await delay(2_000);
  }
  throw new Error(
    `Node did not reach block height ${minHeight} within ${timeoutMs}ms`
  );
}

export function buildCompiledNftZk() {
  const compiled = CompiledContract as unknown as {
    make: (_n: string, _c: unknown) => unknown;
    withWitnesses: (_c: unknown, _w: unknown) => unknown;
    withCompiledFileAssets: (_c: unknown, _p: string) => unknown;
  };
  return compiled.withCompiledFileAssets(
    compiled.withWitnesses(compiled.make("NftZkContract", Contract), witnesses),
    ZK_CONFIG_PATH
  );
}

export async function buildUndeployedProviders(): Promise<BuiltProviders> {
  const network = resolveUndeployedNetwork();
  setNetworkId("undeployed");

  const local = isLocalHost(network.indexer);
  await waitForService(
    network.indexer,
    "indexer",
    120_000,
    local ? "midnight-indexer" : undefined
  );
  await waitForService(
    network.proofServer,
    "proof-server",
    180_000,
    local ? "midnight-proof-server" : undefined
  );
  await waitForBlockHeight(network.indexer, 2, 60_000);

  const env = {
    walletNetworkId: "undeployed",
    networkId: "undeployed",
    indexer: network.indexer,
    indexerWS: network.indexerWS,
    node: network.node,
    nodeWS: network.nodeWS,
    proofServer: network.proofServer,
    faucet: undefined as string | undefined
  };

  console.log("Building undeployed wallet from genesis seed...");
  const logger = createLogger("warn");
  const wallet = await MidnightWalletProvider.build(logger, env, GENESIS_SEED);
  // true = wait until the genesis wallet has synced and sees dust.
  await wallet.start(true);

  const coinPublicKey = wallet.getCoinPublicKey() as unknown as Uint8Array;
  const accountId = Buffer.from(coinPublicKey).toString("hex");
  const zkConfigProvider = new NodeZkConfigProvider(ZK_CONFIG_PATH);

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `nft-zk-undeployed-${Date.now()}`,
      signingKeyStoreName: `nft-zk-undeployed-signing-${Date.now()}`,
      privateStoragePasswordProvider: () => "NftZk-Undeployed-2026!",
      accountId
    }),
    publicDataProvider: indexerPublicDataProvider(
      network.indexer,
      network.indexerWS
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      network.proofServer,
      zkConfigProvider
    ),
    walletProvider: wallet,
    midnightProvider: wallet
  };

  return {
    network,
    providers,
    wallet,
    coinPublicKey
  };
}
