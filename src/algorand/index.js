import algosdk from "algosdk";
import axios from "axios";
import { getAlgodClient } from "../clients";
const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algodClient = getAlgodClient(network);


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

  var token = process.env.NEXT_PUBLIC_INDEXER_TOKEN_TESTNET;
  var port = process.env.NEXT_PUBLIC_INDEXER_PORT_TESTNET;
  var server = process.env.NEXT_PUBLIC_INDEXER_ADDRESS_TESTNET;

  if (process.env.NEXT_PUBLIC_NETWORK === "SandNet") {
    token = process.env.NEXT_PUBLIC_INDEXER_TOKEN;
    server = process.env.NEXT_PUBLIC_INDEXER_SERVER;
    port = process.env.NEXT_PUBLIC_INDEXER_PORT;
  }

  const indexer_client = new algosdk.Indexer(token, server, port);
  var note = undefined;
  console.log(assets);
  if (assets) {
    for (let asset of assets) {
      const assetTxns = await indexer_client
        .lookupAssetTransactions(asset["asset-id"])
        .do();
      console.log("assetTxns: ", assetTxns);
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

const createAssetTransferTxn = async (sender, receiver, assetId, amount) => {
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

const getNFTFromDeployer = async (algodClient, accAddr, assetId) => {
  const suggestedParams = await algodClient.getTransactionParams().do();
  const deployer = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC);

  // asset transfer
  const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: deployer.addr,
    to: accAddr,
    assetIndex: assetId,
    suggestedParams,
    amount: 1,
  });

  return await signAndSubmit(algodClient, [assetTransferTxn], deployer);
};

export { getPaymentTxn, getCreateNftTxn, signAndSubmit, fetchNFTs, getAssetOptInTxn, getNFTFromDeployer, createAssetTransferTxn };