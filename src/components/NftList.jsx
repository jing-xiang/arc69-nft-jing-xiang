import NftItem from "./NftItem";
import { useState } from "react";
import { getAlgodClient } from "../clients";
import { useWallet } from "@txnlab/use-wallet";
import algosdk from "algosdk";
import { createAssetTransferTxn, getAssetOptInTxn } from "@/algorand";


const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algodClient = getAlgodClient(network);

function NftList({ nfts }) {
  const [txnref, setTxnRef] = useState("");
  const [txnUrl, setTxnUrl] = useState("");
  const { activeAddress, signTransactions, sendTransactions } = useWallet();

  const getTxnRefUrl = (txId) => {
    if (network === "SandNet") {
      return `https://app.dappflow.org/explorer/transaction/${txId}`;
    } else if (network === "TestNet") {
      return `https://testnet.algoexplorer.io/tx/${txId}`;
    }

    return "";
  }

  const getThisNFT = async (assetId) => {
    // atomic transfer
    console.log(activeAddress);
    
    //Transaction - Buyer opts into the NFT
    let transaction1 = await getAssetOptInTxn(algodClient, activeAddress, assetId);

    // Transaction - buyer sends FT to the seller
    let transaction2 = await createAssetTransferTxn(activeAddress, process.env.NEXT_PUBLIC_DEPLOYER_ADDR, 211874146, 5); //TODO: update assetID for testnet
    

    // Store all transactions
    let txns = [transaction1, transaction2];

    // Group all transactions
    const groupedTxn = algosdk.assignGroupID(txns);

    // Sign each transaction in the group
    const encodedTxns = groupedTxn.map((txn) => algosdk.encodeUnsignedTransaction(txn));
    const signedtxns = await signTransactions(encodedTxns);
    const res = await sendTransactions(signedtxns, 2);
  };

  return (
    <div className="w-full">
      {activeAddress && txnref && (
        <p className="mb-4 text-left">
          <a href={txnUrl} target="_blank" className="text-blue-500">
            Tx ID: {txnref}
          </a>
        </p>
      )}
      {activeAddress && nfts.map((item, index) => (
        <NftItem
          key={index}
          src={item.imgUrl}
          metadata={item.metadata}
          assetId={item.asset["asset-id"]}
          onButtonClick={getThisNFT}
        />
      ))}
    </div>
  );
}

export default NftList;
