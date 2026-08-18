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

import { describe, expect, it } from "vitest";
import {
  DEFAULT_UNDEPLOYED_NETWORK,
  defaultIndexerWs,
  httpToWs,
  isLocalHost,
  isRetryableDeployError,
  resolveUndeployedNetwork,
  wsToHttp
} from "./network.js";

describe("undeployed network resolution", () => {
  it("defaults to local docker endpoints", () => {
    expect(resolveUndeployedNetwork({})).toEqual(DEFAULT_UNDEPLOYED_NETWORK);
  });

  it("overrides indexer, node, and proof server from env", () => {
    const resolved = resolveUndeployedNetwork({
      MIDNIGHT_INDEXER_URL:
        "https://nft-undeployed-indexer.fly.dev/api/v4/graphql",
      MIDNIGHT_NODE_URL: "http://127.0.0.1:9944",
      MIDNIGHT_PROOF_SERVER_URL: "https://nft-undeployed-proof.fly.dev"
    });
    expect(resolved.indexer).toBe(
      "https://nft-undeployed-indexer.fly.dev/api/v4/graphql"
    );
    expect(resolved.indexerWS).toBe(
      "wss://nft-undeployed-indexer.fly.dev/api/v4/graphql/ws"
    );
    expect(resolved.proofServer).toBe("https://nft-undeployed-proof.fly.dev");
    expect(resolved.nodeWS).toBe("ws://127.0.0.1:9944");
    expect(resolved.networkId).toBe("undeployed");
  });

  it("honours an explicit indexer websocket override", () => {
    const resolved = resolveUndeployedNetwork({
      MIDNIGHT_INDEXER_URL:
        "https://nft-undeployed-indexer.fly.dev/api/v4/graphql",
      MIDNIGHT_INDEXER_WS_URL:
        "wss://nft-undeployed-indexer.fly.dev/api/v4/graphql/ws"
    });
    expect(resolved.indexerWS).toBe(
      "wss://nft-undeployed-indexer.fly.dev/api/v4/graphql/ws"
    );
  });

  it("converts http/https to ws/wss", () => {
    expect(httpToWs("https://example.com")).toBe("wss://example.com");
    expect(wsToHttp("wss://example.com")).toBe("https://example.com");
    expect(defaultIndexerWs("http://127.0.0.1:8088/api/v4/graphql")).toBe(
      "ws://127.0.0.1:8088/api/v4/graphql/ws"
    );
  });

  it("detects localhost vs Fly public URLs", () => {
    expect(isLocalHost("http://127.0.0.1:6300")).toBe(true);
    expect(isLocalHost("https://nft-undeployed-proof.fly.dev")).toBe(false);
  });
});

describe("retryable undeployed errors", () => {
  it("retries dust shortage and TTL custom error 171", () => {
    expect(isRetryableDeployError(new Error("Insufficient Funds"))).toBe(true);
    expect(isRetryableDeployError(new Error("Custom error: 171"))).toBe(true);
    expect(isRetryableDeployError(new Error("Not authorized to mint."))).toBe(
      false
    );
  });
});
