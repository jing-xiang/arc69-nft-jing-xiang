import { getIndexerClient } from "../clients/index";
import algosdk from "algosdk";
import axios from "axios";
// import { getAlgodClient } from "../clients";
const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
// const algodClient = getAlgodClient(network);


const getPaymentTxn = async (algodClient, from, to, amount) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from,
    to,
    amount,
    suggestedParams,
  });
};

const getCreateNftTxn = async (algodClient, from, assetName, defaultFrozen, unitName, assetURL, metadata) => {
  const suggestedParams = await algodClient.getTransactionParams().do();
  // txn to create a pure nft
  return algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from,
    assetName,
    total: 1,
    decimals: 0,
    defaultFrozen,
    unitName,
    assetURL,
    note: metadata,
    suggestedParams,
  });
};

const signAndSubmit = async (algodClient, txns, signer) => {
  // used by backend to sign and submit txns
  const groupedTxns = algosdk.assignGroupID(txns);

  const signedTxns = groupedTxns.map((txn) => txn.signTxn(signer.sk));

  const response = await algodClient.sendRawTransaction(signedTxns).do();

  const confirmation = await algosdk.waitForConfirmation(algodClient, response.txId, 4);

  return {
    response,
    confirmation,
  };
};

const fetchNFTs = async (algodClient) => {
  const deployerAddr = process.env.NEXT_PUBLIC_DEPLOYER_ADDR;
  const { assets } = await algodClient.accountInformation(deployerAddr).do();

  function base64ToJson(base64String) {
    const buffer = Buffer.from(base64String, "base64");
    const jsonString = buffer.toString("utf-8");
    const jsonObj = JSON.parse(jsonString);
    return jsonObj;
  }

  let nfts = [];

  const indexer_client = getIndexerClient(network);

  var note = undefined;
  if (assets) {
    for (let asset of assets) {
      const assetTxns = await indexer_client
        .lookupAssetTransactions(asset["asset-id"])
        .do();
      //console.log("assetTxns: ", assetTxns);
      const acfg_txns = assetTxns.transactions
        .filter((txn) => txn["tx-type"] === "acfg")
        .forEach((txns) => {
          if (txns.note != undefined) {
            try {
              note = base64ToJson(txns.note);
            } catch (e) {
              console.log(e);
            }
          }
        });
       
      const assetInfo = await algodClient.getAssetByID(asset["asset-id"]).do();
      const { decimals, total, url } = assetInfo.params;

      const isNFT =
        url !== undefined &&
        url.includes("ipfs://") &&
        total === 1 &&
        decimals === 0;
      const deployerHasNFT = asset.amount > 0;

      if (isNFT && deployerHasNFT) {
        try {
          const metadata = note;
          const imgUrl = url.replace(
            "ipfs://",
            "https://cloudflare-ipfs.com/ipfs/"
          );

          if (url != undefined) {
            nfts.push({
              asset,
              assetInfo,
              metadata,
              imgUrl,
            });
          }
        } catch (error) {
          console.log(error);
          continue;
        }
      }
    }
  }

  return nfts;
};

const getAssetOptInTxn = async (algodClient, accAddr, assetId) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: accAddr,
    to: accAddr,
    assetIndex: assetId,
    suggestedParams,
  });
};

const createAssetTransferTxn = async (algodClient, sender, receiver, assetId, amount) => {
  // create suggested parameters
  const suggestedParams = await algodClient.getTransactionParams().do();

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: sender,
    to: receiver,
    assetIndex: assetId,
    amount,
    suggestedParams
  });

  return txn;
}

export { getPaymentTxn, getCreateNftTxn, signAndSubmit, fetchNFTs, getAssetOptInTxn, createAssetTransferTxn };