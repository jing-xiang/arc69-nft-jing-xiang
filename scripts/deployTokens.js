import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { getAlgodClient } from "../src/clients/index.js";
import algosdk from "algosdk";

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algodClient = getAlgodClient(network);

// get seller and buyer accounts
const buyer = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_BUYER_MNEMONIC);
const deployer = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC);
const seller = deployer;

const submitToNetwork = async (signedTxn) => {
  // send txn
  let tx = await algodClient.sendRawTransaction(signedTxn).do();
  console.log("Transaction : " + tx.txId);

  // Wait for transaction to be confirmed
  confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

  //Get the completed Transaction
  console.log(
    "Transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  return confirmedTxn;
};

const sendAlgos = async (sender, receiver, amount) => {
  // create suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();

  let txn = algosdk.makePaymentTxnWithSuggestedParams(
    sender.addr,
    receiver.addr,
    amount,
    undefined,
    undefined,
    suggestedParams
  );

  // sign the transaction
  const signedTxn = txn.signTxn(sender.sk);

  const confirmedTxn = await submitToNetwork(signedTxn);
};

const createAsset = async (maker) => {
  const total = 1000; // total supply
  const decimals = 0; // units of this asset are whole-integer amounts
  const assetName = "Fungible Token"; //token asset name
  const unitName = "FT"; //token unit name
  const url = "ipfs://cid";
  const metadata = undefined;
  const defaultFrozen = false; // whether accounts should be frozen by default

  // create suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();

  // create the asset creation transaction
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: maker.addr,
    total,
    decimals,
    assetName,
    unitName,
    assetURL: url,
    assetMetadataHash: metadata,
    defaultFrozen,
    freeze: seller.addr,
    manager: seller.addr,
    clawback: seller.addr,
    reserve: seller.addr,

    suggestedParams,
  });

  // sign the transaction
  const signedTxn = txn.signTxn(maker.sk);

  return await submitToNetwork(signedTxn);
};

(async () => {
  //fund accounts
  console.log("Funding accounts...");
  await sendAlgos(deployer, buyer, 1e6); // 1 Algo
  await sendAlgos(deployer, seller, 1e6); // 1 Algo
  const suggestedParams = await algodClient.getTransactionParams().do();
// Create asset
const res = await createAsset(seller);
const assetId = res["asset-index"];

console.log(`Opted in buyer account ${buyer.addr} to asset with ID: ${assetId}`);
//buyer opts into asset
let optintxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
  buyer.addr,
  buyer.addr,
  undefined,
  undefined,
  0,
  undefined,
  assetId,
  suggestedParams
);
let signedoptintxn = optintxn.signTxn(buyer.sk);
await submitToNetwork(signedoptintxn);

  // Transfer 100 fungible tokens to your buyer account
  let transferTxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    seller.addr,
    buyer.addr,
    undefined,
    undefined,
    100,
    undefined,
    assetId,
    suggestedParams
  );
  let signedTransferTxn = transferTxn.signTxn(seller.sk);
  await submitToNetwork(signedTransferTxn);

// Check
console.log("Receiver assets: ", (await algodClient.accountInformation(seller.addr).do()).assets);
console.log("New recipient assets: ", (await algodClient.accountInformation(buyer.addr).do()).assets);
console.log(assetId);
})();
export {buyer, seller};