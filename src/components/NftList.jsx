import NftItem from "./NftItem";
import { useState } from "react";
import { getAlgodClient } from "../clients";
import { useWallet } from "@txnlab/use-wallet";

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
    // write your code here
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
