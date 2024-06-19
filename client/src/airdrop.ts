/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dotenv from "dotenv";
dotenv.config();

import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { createAccountInfo, checkAccountInitialized } from "./utils";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenSaleAccountLayoutInterface, TokenSaleAccountLayout } from "./account";
import BN = require("bn.js");
import bs58 = require("bs58");

type InstructionNumber = 0 | 1 | 2 | 3;

const transaction = async () => {
  console.log("4. Airdrop Tokens");
  //phase1 (setup Transaction & send Transaction)
  console.log("Setup Airdrop Transaction");
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const tokenSaleProgramId = new PublicKey(process.env.CUSTOM_PROGRAM_ID!);
  const sellerPubkey = new PublicKey(process.env.SELLER_PUBLIC_KEY!);
  const airdropPubkey = new PublicKey(process.env.BUYER_PUBLIC_KEY!);
  const airdropPrivateKey = Uint8Array.from(bs58.decode(process.env.BUYER_PRIVATE_KEY!));
  const airdropKeypair = new Keypair({
    publicKey: airdropPubkey.toBytes(),
    secretKey: airdropPrivateKey,
  });

  const number_of_tokens = 10;

  const tokenPubkey = new PublicKey(process.env.TOKEN_PUBKEY!);
  const tokenSaleProgramAccountPubkey = new PublicKey(process.env.TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY!);
  const sellerTokenAccountPubkey = new PublicKey(process.env.SELLER_TOKEN_ACCOUNT_PUBKEY!);
  const tempTokenAccountPubkey = new PublicKey(process.env.TEMP_TOKEN_ACCOUNT_PUBKEY!);
  const instruction: InstructionNumber = 2;

  const tokenSaleProgramAccount = await checkAccountInitialized(connection, tokenSaleProgramAccountPubkey);
  const encodedTokenSaleProgramAccountData = tokenSaleProgramAccount.data;
  const decodedTokenSaleProgramAccountData = TokenSaleAccountLayout.decode(
    encodedTokenSaleProgramAccountData
  ) as TokenSaleAccountLayoutInterface;
  const tokenSaleProgramAccountData = {
    isInitialized: decodedTokenSaleProgramAccountData.isInitialized,
    sellerPubkey: new PublicKey(decodedTokenSaleProgramAccountData.sellerPubkey),
    tempTokenAccountPubkey: new PublicKey(decodedTokenSaleProgramAccountData.tempTokenAccountPubkey),
    swapSolAmount: decodedTokenSaleProgramAccountData.swapSolAmount,
    swapTokenAmount: decodedTokenSaleProgramAccountData.swapTokenAmount,
  };

  const token = new Token(connection, tokenPubkey, TOKEN_PROGRAM_ID, airdropKeypair);
  const airdropTokenAccount = await token.getOrCreateAssociatedAccountInfo(airdropKeypair.publicKey);

  const PDA = await PublicKey.findProgramAddress([Buffer.from("token_sale")], tokenSaleProgramId);

  const buyTokenIx = new TransactionInstruction({
    programId: tokenSaleProgramId,
    keys: [
      createAccountInfo(airdropKeypair.publicKey, true, true),
      createAccountInfo(tokenSaleProgramAccountData.sellerPubkey, false, true),
      createAccountInfo(tokenSaleProgramAccountData.tempTokenAccountPubkey, false, true),
      createAccountInfo(tokenSaleProgramAccountPubkey, false, true),
      createAccountInfo(airdropTokenAccount.address, false, true),
      createAccountInfo(TOKEN_PROGRAM_ID, false, false),
      createAccountInfo(PDA[0], false, false),
    ],
    data: Buffer.from(Uint8Array.of(instruction, ...new BN(number_of_tokens).toArray("le",8))),
  });

    
  const tx = new Transaction().add(buyTokenIx);

  await sendAndConfirmTransaction(connection, tx, [airdropKeypair]);
  //phase1 end

  //phase2 (check token sale)
  const sellerTokenAccountBalance = await connection.getTokenAccountBalance(sellerTokenAccountPubkey);
  const tempTokenAccountBalance = await connection.getTokenAccountBalance(tempTokenAccountPubkey);
  const airdropTokenAccountBalance = await connection.getTokenAccountBalance(airdropTokenAccount.address);

  console.table([
    {
      sellerTokenAccountBalance: sellerTokenAccountBalance.value.amount.toString(),
      tempTokenAccountBalance: tempTokenAccountBalance.value.amount.toString(),
      airdropTokenAccountBalance: airdropTokenAccountBalance.value.amount.toString(),
    },
  ]);

  const sellerSOLBalance = await connection.getBalance(sellerPubkey, "confirmed");
  const airdropSOLBalance = await connection.getBalance(airdropKeypair.publicKey, "confirmed");

  console.table([
    {
      sellerSOLBalance: sellerSOLBalance / LAMPORTS_PER_SOL,
      airdropSOLBalance: airdropSOLBalance / LAMPORTS_PER_SOL,
    },
  ]);

  console.log(`✨TX successfully finished✨\n`);
  //#phase2 end
};

transaction();
