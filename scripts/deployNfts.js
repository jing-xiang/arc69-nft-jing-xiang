import pinataSDK from "@pinata/sdk";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as mime from "mime-types";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { getAlgodClient } from "../src/clients/index.js";
import algosdk from "algosdk";

const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algodClient = getAlgodClient(network);

// get creator account
const deployer = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC);

(async () => {
  // check pinata connection
  const response = await pinata.testAuthentication();
  if (!response) {
    console.log("Unable to authenticate with Pinata");
    return;
  }

  // write your code here
})();
