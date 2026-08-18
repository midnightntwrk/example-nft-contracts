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

export type UndeployedNetwork = {
  networkId: "undeployed";
  indexer: string;
  indexerWS: string;
  node: string;
  nodeWS: string;
  proofServer: string;
};

export const DEFAULT_UNDEPLOYED_NETWORK: UndeployedNetwork = {
  networkId: "undeployed",
  indexer: "http://127.0.0.1:8088/api/v4/graphql",
  indexerWS: "ws://127.0.0.1:8088/api/v4/graphql/ws",
  node: "http://127.0.0.1:9944",
  nodeWS: "ws://127.0.0.1:9944",
  proofServer: "http://127.0.0.1:6300"
};

export const GENESIS_SEED =
  "0000000000000000000000000000000000000000000000000000000000000002";

export function httpToWs(url: string): string {
  return url.replace(/^http:\/\//, "ws://").replace(/^https:\/\//, "wss://");
}

export function wsToHttp(url: string): string {
  return url.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");
}

export function defaultIndexerWs(indexer: string): string {
  const ws = httpToWs(indexer).replace(/\/$/, "");
  return ws.endsWith("/ws") ? ws : `${ws}/ws`;
}

export function isLocalHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "127.0.0.1" || hostname === "localhost";
  } catch {
    return false;
  }
}

export function isRetryableDeployError(error: unknown): boolean {
  const msg = String(error instanceof Error ? error.message : error);
  return /Insufficient Funds|Custom error: 171|Invalid Transaction|Transaction submission error/i.test(
    msg
  );
}

/**
 * Resolve undeployed endpoints from env so the same deploy/mint scripts
 * can target local Docker or a Fly.io hosted stack.
 *
 *   MIDNIGHT_INDEXER_URL
 *   MIDNIGHT_INDEXER_WS_URL
 *   MIDNIGHT_NODE_URL
 *   MIDNIGHT_PROOF_SERVER_URL
 */
export function resolveUndeployedNetwork(
  env: NodeJS.Dict<string> = process.env
): UndeployedNetwork {
  const indexer =
    env.MIDNIGHT_INDEXER_URL ?? DEFAULT_UNDEPLOYED_NETWORK.indexer;
  const node = env.MIDNIGHT_NODE_URL ?? DEFAULT_UNDEPLOYED_NETWORK.node;
  const proofServer =
    env.MIDNIGHT_PROOF_SERVER_URL ?? DEFAULT_UNDEPLOYED_NETWORK.proofServer;
  const nodeWs = env.MIDNIGHT_NODE_WS_URL ?? httpToWs(node);

  return {
    networkId: "undeployed",
    indexer,
    indexerWS: env.MIDNIGHT_INDEXER_WS_URL ?? defaultIndexerWs(indexer),
    node: node.startsWith("ws") ? wsToHttp(node) : node,
    nodeWS: nodeWs.startsWith("http") ? httpToWs(nodeWs) : nodeWs,
    proofServer
  };
}
