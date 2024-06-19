/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dotenv from "dotenv";
dotenv.config();

import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import * as BN from "bn.js";
import { checkAccountInitialized, checkAccountDataIsValid, createAccountInfo, updateEnv } from "./utils";

import {
  TokenSaleAccountLayout,
  TokenSaleAccountLayoutInterface,
  ExpectedTokenSaleAccountLayoutInterface,
} from "./account";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 = require("bs58");

type InstructionNumber = 0 | 1 | 2 | 3;

const transaction = async () => {  
  console.log("2. Start Token Sale");

  //phase1 (setup Transaction & send Transaction)
  console.log("Setup Transaction");
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const tokenSaleProgramId = new PublicKey(process.env.CUSTOM_PROGRAM_ID!);
  const sellerPubkey = new PublicKey(process.env.SELLER_PUBLIC_KEY!);
  const sellerPrivateKey = Uint8Array.from(bs58.decode(process.env.SELLER_PRIVATE_KEY!));
  const sellerKeypair = new Keypair({
    publicKey: sellerPubkey.toBytes(),
    secretKey: sellerPrivateKey,
  });
  const tokenMintAccountPubkey = new PublicKey(process.env.TOKEN_PUBKEY!);
  const sellerTokenAccountPubkey = new PublicKey(process.env.SELLER_TOKEN_ACCOUNT_PUBKEY!);
  console.log("sellerTokenAccountPubkey: ", sellerTokenAccountPubkey.toBase58());
  const instruction: InstructionNumber = 0;
  const amountOfTokenWantToSale = 1000;
  const perTokenPrice = 0.0075 * LAMPORTS_PER_SOL;
  const maxTokenPrice = 0.01 * LAMPORTS_PER_SOL;
  const increaseTokenPrice = 0.0005 * LAMPORTS_PER_SOL;
  const phaseDelayTime = 3600 * 24 * 21;

  const tempTokenAccountKeypair = new Keypair();
  const createTempTokenAccountIx = SystemProgram.createAccount({
    fromPubkey: sellerKeypair.publicKey,
    newAccountPubkey: tempTokenAccountKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span),
    space: AccountLayout.span,
    programId: TOKEN_PROGRAM_ID,
  });

  const initTempTokenAccountIx = Token.createInitAccountInstruction(
    TOKEN_PROGRAM_ID,
    tokenMintAccountPubkey,
    tempTokenAccountKeypair.publicKey,
    sellerKeypair.publicKey
  );

  const transferTokenToTempTokenAccountIx = Token.createTransferInstruction(
    TOKEN_PROGRAM_ID,
    sellerTokenAccountPubkey,
    tempTokenAccountKeypair.publicKey,
    sellerKeypair.publicKey,
    [],
    amountOfTokenWantToSale
  );

  const tokenSaleProgramAccountKeypair = new Keypair();
  const createTokenSaleProgramAccountIx = SystemProgram.createAccount({
    fromPubkey: sellerKeypair.publicKey,
    newAccountPubkey: tokenSaleProgramAccountKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(TokenSaleAccountLayout.span),
    space: TokenSaleAccountLayout.span,
    programId: tokenSaleProgramId,
  });

  console.log("tokenSaleProgramId", tokenSaleProgramId.toBase58());

  const initTokenSaleProgramIx = new TransactionInstruction({
    programId: tokenSaleProgramId,
    keys: [
      createAccountInfo(sellerKeypair.publicKey, true, false),
      createAccountInfo(tempTokenAccountKeypair.publicKey, false, true),
      createAccountInfo(tokenSaleProgramAccountKeypair.publicKey, false, true),
      createAccountInfo(SYSVAR_RENT_PUBKEY, false, false),
      createAccountInfo(TOKEN_PROGRAM_ID, false, false),
    ],
    data: Buffer.from(
      Uint8Array.of(instruction, 
        ...new BN(perTokenPrice).toArray("le", 8),
        ...new BN(maxTokenPrice).toArray("le", 8),
        ...new BN(increaseTokenPrice).toArray("le", 8),
        ...new BN(phaseDelayTime).toArray("le", 8),
      )
    ),
  });
  
  console.log("Send transaction...\n");
  const tx = new Transaction().add(
    createTempTokenAccountIx,
    initTempTokenAccountIx,
    transferTokenToTempTokenAccountIx,
    createTokenSaleProgramAccountIx,
    initTokenSaleProgramIx
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [sellerKeypair, tempTokenAccountKeypair, tokenSaleProgramAccountKeypair]);
  console.log("signature: ", signature);
  //phase1 end

  //phase2 (check Transaction result is valid)
  const tokenSaleProgramAccount = await checkAccountInitialized(connection, tokenSaleProgramAccountKeypair.publicKey);

  const encodedTokenSaleProgramAccountData = tokenSaleProgramAccount.data;
  const decodedTokenSaleProgramAccountData = TokenSaleAccountLayout.decode(
    encodedTokenSaleProgramAccountData
  ) as TokenSaleAccountLayoutInterface;

  const expectedTokenSaleProgramAccountData: ExpectedTokenSaleAccountLayoutInterface = {
    isInitialized: 1,
    sellerPubkey: sellerKeypair.publicKey,
    tempTokenAccountPubkey: tempTokenAccountKeypair.publicKey,
    pricePerToken: perTokenPrice,
    maxTokenPrice: maxTokenPrice,
    increaseTokenPrice: increaseTokenPrice,
    pucharsedTokenAmount: 0,
    phaseStartTime: 0,
    phaseDelayTime: phaseDelayTime
  };

  console.log("Current TokenSaleProgramAccountData");
  checkAccountDataIsValid(decodedTokenSaleProgramAccountData, expectedTokenSaleProgramAccountData);

  console.table([
    {
      tokenSaleProgramAccountPubkey: tokenSaleProgramAccountKeypair.publicKey.toString(),
    },
  ]);
  console.log(`✨TX successfully finished✨\n`);
  //#phase2 end

  process.env.TOKEN_SALE_PROGRAM_ACCOUNT_PUBKEY = tokenSaleProgramAccountKeypair.publicKey.toString();
  process.env.TEMP_TOKEN_ACCOUNT_PUBKEY = tempTokenAccountKeypair.publicKey.toString();
  updateEnv();
};

transaction();
