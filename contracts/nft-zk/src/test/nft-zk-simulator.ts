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
  ledger,
  pureCircuits
} from "../../../managed/nft-zk/contract/index.js";
import {
  type NftZkPrivateState,
  createNftZkPrivateState,
  witnesses
} from "../witnesses.js";
import { fromHex, isHex } from "@midnight-ntwrk/midnight-js-utils";
import { TextEncoder } from "util";

export class NftZkSimulator {
  readonly contract: Contract<NftZkPrivateState>;
  circuitContext: CircuitContext<NftZkPrivateState>;

  constructor() {
    this.contract = new Contract<NftZkPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState
    } = this.contract.initialState(
      createConstructorContext(
        createNftZkPrivateState(
          this.stringToBytes("my_local_secret").bytes,
          this.stringToBytes("my_shared_secret").bytes,
          this.stringToBytes("my_admin_secret_key").bytes
        ),
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

  public getLocalSecret(): Uint8Array {
    return this.circuitContext.currentPrivateState.local_secret;
  }

  public getSharedSecret(): Uint8Array {
    return this.circuitContext.currentPrivateState.shared_secret;
  }

  public balanceOf(owner: CoinPublicKey): bigint {
    return this.contract.circuits.balanceOf(
      this.circuitContext,
      this.publicKeyToBytes(owner)
    ).result;
  }

  public ownerOf(tokenId: bigint): bigint {
    return this.contract.circuits.ownerOf(this.circuitContext, tokenId).result;
  }

  public approve(to: CoinPublicKey, tokenId: bigint): void {
    this.circuitContext = this.contract.impureCircuits.approve(
      this.circuitContext,
      this.publicKeyToBytes(to),
      tokenId
    ).context;
  }

  public getApproved(tokenId: bigint): bigint {
    return this.contract.circuits.getApproved(this.circuitContext, tokenId)
      .result;
  }

  public setApprovalForAll(operator: CoinPublicKey, approved: boolean): void {
    this.circuitContext = this.contract.impureCircuits.setApprovalForAll(
      this.circuitContext,
      this.publicKeyToBytes(operator),
      approved
    ).context;
  }

  public isApprovedForAll(
    ownerHashKey: bigint,
    operatorHashKey: bigint
  ): boolean {
    return this.contract.circuits.isApprovedForAll(
      this.circuitContext,
      ownerHashKey,
      operatorHashKey
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
    fromHashKey: bigint,
    to: CoinPublicKey,
    tokenId: bigint
  ): void {
    this.circuitContext = this.contract.impureCircuits.transferFrom(
      this.circuitContext,
      fromHashKey,
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

  public stringToBytes(str: string): { bytes: Uint8Array } {
    const encoded = new TextEncoder().encode(str);
    const bytes = new Uint8Array(32);
    bytes.set(encoded.slice(0, 32));
    return { bytes };
  }

  public publicKeyToBytes(publicKey: CoinPublicKey): { bytes: Uint8Array } {
    if (isHex(publicKey)) {
      const bytes = fromHex(publicKey.padStart(64, "0"));
      const result = new Uint8Array(32);
      result.set(bytes.slice(0, 32));
      return { bytes: result };
    }
    return this.stringToBytes(publicKey);
  }

  public generateHashKey(publicKey: Uint8Array, secret: Uint8Array): bigint {
    return pureCircuits.generateHashKey(publicKey, secret);
  }

  public generateLocalUserHashKey(publicKey: CoinPublicKey): bigint {
    return this.generateHashKey(
      this.publicKeyToBytes(publicKey).bytes,
      this.getLocalSecret()
    );
  }

  public generateSharedUserHashKey(publicKey: CoinPublicKey): bigint {
    return this.generateHashKey(
      this.publicKeyToBytes(publicKey).bytes,
      this.getSharedSecret()
    );
  }
}
