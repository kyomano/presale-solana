import { PublicKey } from "@solana/web3.js";

//@ts-expect-error missing types
import * as BufferLayout from "buffer-layout";

export const TokenSaleAccountLayout = BufferLayout.struct([
  BufferLayout.u8("isInitialized"),
  BufferLayout.blob(32, "sellerPubkey"),
  BufferLayout.blob(32, "tempTokenAccountPubkey"),
  BufferLayout.blob(8, "pricePerToken"),
  BufferLayout.blob(8, "maxTokenPrice"),
  BufferLayout.blob(8, "increaseTokenPrice"),
  BufferLayout.blob(8, "pucharsedTokenAmount"),
  BufferLayout.blob(8, "phaseStartTime"),
  BufferLayout.blob(8, "phaseDelayTime"),
]);

export interface TokenSaleAccountLayoutInterface {
  [index: string]: number | Uint8Array;
  isInitialized: number;
  sellerPubkey: Uint8Array;
  tempTokenAccountPubkey: Uint8Array;
  pricePerToken: Uint8Array;
  maxTokenPrice: Uint8Array;
  increaseTokenPrice: Uint8Array;
  pucharsedTokenAmount: Uint8Array;
  phaseStartTime: Uint8Array;
  phaseDelayTime: Uint8Array;
}

export interface ExpectedTokenSaleAccountLayoutInterface {
  [index: string]: number | PublicKey;
  isInitialized: number;
  sellerPubkey: PublicKey;
  tempTokenAccountPubkey: PublicKey;
  pricePerToken: number;
  maxTokenPrice: number;
  increaseTokenPrice: number;
  pucharsedTokenAmount: number;
  phaseStartTime: number;
  phaseDelayTime: number;
}
