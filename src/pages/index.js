import Head from "next/head";
import styles from "@/styles/Home.module.css";
import Navbar from "@/components/Navbar";
import NftList from "@/components/NftList";
import TransferNFTForm from "@/components/TransferNftForm";
import { useEffect, useState } from "react";
import { getAlgodClient } from "../clients";
import { useWallet } from "@txnlab/use-wallet";
import * as algotxn from "@/algorand"

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algodClient = getAlgodClient(network);

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [isSeller, setIsSeller] = useState(false);
  const { activeAddress } = useWallet();

  useEffect(() => {
    const loadNfts = async () => {
      // write code to load NFTs
      const NftList = await algotxn.fetchNFTs(algodClient);
      setNfts(NftList);
    };

    loadNfts();

    // is active address a buyer or seller account?
    if (activeAddress === process.env.NEXT_PUBLIC_DEPLOYER_ADDR) {
      setIsSeller(true);
    } else {
      setIsSeller(false);
    }
  }, [activeAddress]);

  return (
    <>
      <Head>
        <title>ARC69 Transaction</title>
        <meta name="description" content="ARC69 Transaction" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className={styles.main}>
        <div>
          <h1 className="text-5xl mb-4">Transfer NFTs</h1>
          <span className="mb-4">Network: {network}</span>
        </div>
        {isSeller && <TransferNFTForm nfts={nfts} />}
        <NftList nfts={nfts} />
      </main>
    </>
  );
}
