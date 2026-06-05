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
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
  type CoinPublicKey
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger
} from "../../../managed/nft/contract/index.js";
import {
  type NftPrivateState,
  createNftPrivateState,
  witnesses
} from "../witnesses.js";
import { toHex, fromHex, isHex } from "@midnight-ntwrk/midnight-js-utils";
import { TextEncoder } from "util";

export class NftSimulator {
  readonly contract: Contract<NftPrivateState>;
  circuitContext: CircuitContext<NftPrivateState>;

  constructor() {
    this.contract = new Contract<NftPrivateState>(witnesses);
    const adminSecretKey = new Uint8Array(32);
    new TextEncoder().encodeInto("admin_secret_key", adminSecretKey);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState
    } = this.contract.initialState(
      createConstructorContext(
        createNftPrivateState(adminSecretKey),
        this.createPublicKey("Alice")
      )
    );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState
    );
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public balanceOf(owner: CoinPublicKey): bigint {
    return this.contract.circuits.balanceOf(
      this.circuitContext,
      this.publicKeyToBytes(owner)
    ).result;
  }

  public ownerOf(tokenId: bigint): CoinPublicKey {
    return this.bytesToPublicKey(
      this.contract.circuits.ownerOf(this.circuitContext, tokenId).result
    );
  }

  public approve(to: CoinPublicKey, tokenId: bigint): void {
    this.circuitContext = this.contract.impureCircuits.approve(
      this.circuitContext,
      this.publicKeyToBytes(to),
      tokenId
    ).context;
  }

  public getApproved(tokenId: bigint): CoinPublicKey {
    return this.bytesToPublicKey(
      this.contract.circuits.getApproved(this.circuitContext, tokenId).result
    );
  }

  public setApprovalForAll(operator: CoinPublicKey, approved: boolean): void {
    this.circuitContext = this.contract.impureCircuits.setApprovalForAll(
      this.circuitContext,
      this.publicKeyToBytes(operator),
      approved
    ).context;
  }

  public isApprovedForAll(
    owner: CoinPublicKey,
    operator: CoinPublicKey
  ): boolean {
    return this.contract.circuits.isApprovedForAll(
      this.circuitContext,
      this.publicKeyToBytes(owner),
      this.publicKeyToBytes(operator)
    ).result;
  }

  public transfer(to: CoinPublicKey, tokenId: bigint): void {
    this.circuitContext = this.contract.impureCircuits.transfer(
      this.circuitContext,
      this.publicKeyToBytes(to),
      tokenId
    ).context;
  }

  public transferFrom(
    from: CoinPublicKey,
    to: CoinPublicKey,
    tokenId: bigint
  ): void {
    this.circuitContext = this.contract.impureCircuits.transferFrom(
      this.circuitContext,
      this.publicKeyToBytes(from),
      this.publicKeyToBytes(to),
      tokenId
    ).context;
  }

  public mintAdmin(to: CoinPublicKey, tokenId: bigint): void {
    this.circuitContext = this.contract.impureCircuits.mintAdmin(
      this.circuitContext,
      this.publicKeyToBytes(to),
      tokenId
    ).context;
  }

  public burnAdmin(tokenId: bigint): void {
    this.circuitContext = this.contract.impureCircuits.burnAdmin(
      this.circuitContext,
      tokenId
    ).context;
  }

  public createPublicKey(userName: string): CoinPublicKey {
    const encoded = new TextEncoder().encode(userName);
    const hexChars: string[] = [];
    for (let i = 0; i < 32; i++) {
      const byte =
        i < encoded.length
          ? encoded[i]
          : (userName.charCodeAt(i % userName.length) + i) % 256;
      hexChars.push(byte.toString(16).padStart(2, "0"));
    }
    return hexChars.join("") as CoinPublicKey;
  }

  public publicKeyToBytes(publicKey: CoinPublicKey): { bytes: Uint8Array } {
    if (isHex(publicKey)) {
      const bytes = fromHex(publicKey.padStart(64, "0"));
      const result = new Uint8Array(32);
      result.set(bytes.slice(0, 32));
      return { bytes: result };
    }
    const encoded = new TextEncoder().encode(publicKey);
    const bytes = new Uint8Array(32);
    bytes.set(encoded.slice(0, 32));
    return { bytes };
  }

  public bytesToPublicKey(bytesObj: { bytes: Uint8Array }): CoinPublicKey {
    return toHex(bytesObj.bytes) as CoinPublicKey;
  }
}
