import { useWallet } from "@txnlab/use-wallet";
import { useState } from "react";
import { getAlgodClient } from "../clients";
import Button from "./Button";
import algosdk from "algosdk";
import NftItem from "./NftItem";
import NftList from "./NftList";
import { createAssetTransferTxn, } from "../algorand/index";


const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algodClient = getAlgodClient(network);

export default function TransferNFTForm({ nfts }) {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [receiver, setReceiver] = useState("");
  const [nft, setNft] = useState("");
  const [txnref, setTxnRef] = useState("");
  const handleChange = (event) => {
    setNft(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // write your code here
    console.log(nft)
    let nfttxn = [await createAssetTransferTxn(algodClient, process.env.NEXT_PUBLIC_DEPLOYER_ADDR, receiver, parseInt(nft), 1)];

    // Group all transactions
    const groupedTxn = algosdk.assignGroupID(nfttxn);

    // Sign  
    const encodedTxns = groupedTxn.map((txn) => algosdk.encodeUnsignedTransaction(txn));
    const signedtxns = await signTransactions(encodedTxns);
    const res = await sendTransactions(signedtxns, 4);
    //refresh list
    if (res){
    setNft(() => {
      return nfts.filter(nft => nft.asset["asset-id"] !== nft);
    })
    //display txn id
    setTxnRef(res.txId);
  }
  };
  

  return (
    <div className="w-full">
      {txnref && <p className="mb-4">Txn ID: {txnref} </p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4 w-full">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="to">
            Select NFT to transfer
          </label>
          <select value={nft} onChange={(e) => setNft(parseInt(e.target.value))} className="block text-gray-700 text-sm font-bold mb-2">
            {nfts.map((n, index) => (
              <option key={index} value={n.asset["asset-id"]}>
                {n.asset["asset-id"]}
              </option>
            ))}
          </select>
        </div>  
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="to">
            To
          </label>
          <input
            className="w-full"
            name="to"
            onChange={(e) => setReceiver(e.target.value)}
            value={receiver}
            type="text"
            placeholder="Recipient Address"
          />
        </div>
        <Button label="Send NFT" type="submit" />
      </form>
    </div>
  );
}
