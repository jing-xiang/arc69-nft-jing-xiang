import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { getAlgodClient } from "../src/clients/index.js";
import algosdk from "algosdk";
import { signAndSubmit } from "../src/algorand/index.js";

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algodClient = getAlgodClient(network);

// get seller and buyer accounts
const buyer = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_BUYER_MNEMONIC);
const deployer = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC);
const seller = deployer;

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

  // sign the transaction and submit to network
  console.log(await signAndSubmit(algodClient, [txn], sender));
};

const createAsset = async (maker) => {
  const total = 1000; // total supply
  const decimals = 0; // units of this asset are whole-integer amounts
  const assetName = "Fungible Token"; //token asset name
  const unitName = "FT"; //token unit name
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
    assetURL: "ipfs://cid",
    assetMetadataHash: metadata,
    defaultFrozen,
    freeze: undefined,
    manager: undefined,
    clawback: undefined,
    reserve: undefined,

    suggestedParams,
  });

  // sign the transaction and submit to network
  // sign and submit the transaction
  const { confirmation } = await signAndSubmit(algodClient, [txn], maker);

  // Extract the asset ID from the confirmation object
  const assetId = confirmation['asset-index'];

  return assetId;
};

(async () => {
  //fund accounts
  console.log("Funding accounts...");
  await sendAlgos(deployer, buyer, 1e6); // 1 Algo
  await sendAlgos(deployer, seller, 1e6); // 1 Algo
  const suggestedParams = await algodClient.getTransactionParams().do();
// Create asset
const assetId = await createAsset(seller);

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
console.log(await signAndSubmit(algodClient, [optintxn], buyer));

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
  console.log(await signAndSubmit(algodClient, [transferTxn], seller));

// Check
console.log("Receiver assets: ", (await algodClient.accountInformation(seller.addr).do()).assets);
console.log("New recipient assets: ", (await algodClient.accountInformation(buyer.addr).do()).assets);
console.log(assetId);
})();
export {buyer, seller};