import { useWallet } from "@txnlab/use-wallet";
import { useState } from "react";
import { getAlgodClient } from "../clients";
import Button from "./Button";

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algod = getAlgodClient(network);

export default function TransferNFTForm({ nfts }) {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [receiver, setReceiver] = useState("");
  const [nft, setNft] = useState("");
  const [txnref, setTxnRef] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    // write your code here
  };

  return (
    <div className="w-full">
      {txnref && <p className="mb-4">Txn ID: {txnref} </p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4 w-full">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="to">
            Select NFT to transfer
          </label>
          <select value={nft} onChange={setNft}>
            {nfts.map((n, index) => (
              <option key={index} value={n.asset["asset-id"]}>
                NFT1
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
