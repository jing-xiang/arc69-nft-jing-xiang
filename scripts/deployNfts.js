import pinataSDK from "@pinata/sdk";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as mime from "mime-types";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import * as algotxns from "../src/algorand/index.js";
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

  // list of asset names
  const assetNames = ["ACS Corgi", "ACS Shiba Inu"];

  // read directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sourcePath = path.join(__dirname, "../assets/nfts/");

  const ipfshashes = [];

  const shibahash = "./assets/nfts/shibainu.jpeg";
  const corgihash = "./assets/nfts/corgi.jpeg";

  const readableshibahash = fs.createReadStream(shibahash);
  const readablecorgihash = fs.createReadStream(corgihash);

  await pinata.pinFileToIPFS(readableshibahash).then((result) => {
    //handle results here
    console.log(result);
    ipfshashes.push(result.IpfsHash);
}).catch((err) => {
    //handle error here
    console.log(err);
});

  await pinata.pinFileToIPFS(readablecorgihash).then((result) => {
    //handle results here
    console.log(result);
    ipfshashes.push(result.IpfsHash);
  }).catch((err) => {
    //handle error here
    console.log(err);
  });




  const assets = fs.readdirSync(sourcePath).map((file, index) => {
    const asset = {
      index: index + 1, // 1-based index
      name: `${assetNames[index]} #${index + 1}`, // e.g Corgi #1
      description: `Asset ${index + 1}/${assetNames.length}`,
      image_mimetype: mime.lookup(file),
      file: file,
      ipfs: ipfshashes[index],
    };
    return asset;
  });
  console.log(assets);





  // prepare to deploy assets
  await Promise.all(
    assets.map(async (asset) => {
      // construct JSON metadata for each asset
      const metadata = {
        name: asset.name,
        standard: "arc69",
        description: asset.description,
        image: `ipfs://${asset.ipfs}`,
        mimetype: asset.image_mimetype,
      };

      // pin metadata
      const jsonOptions = {
        pinataMetadata: {
          name: `${asset.index}-metadata.json`,
        },
        pinataOptions: {
          cidVersion: 0,
        },
      };

      const resultMeta = await pinata.pinJSONToIPFS(metadata, jsonOptions);
      console.log("JSON Metadata pinned: ", resultMeta);

      // // ARC69 type
      // const preparedAsset = {
      //   name: asset.name,
      //   url: `ipfs://${resultMeta.IpfsHash}#i`,//Specify mimetype in asset url.
      //   type: "arc69",
      // };

      // deploy asset
      var JSONtoarray = function(json){
        var str = JSON.stringify(json, null, 0);
        var ret  = new Uint8Array(str.length);
        for (var i = 0; i < str.length; i++){
          ret[i] = str.charCodeAt(i);
        }
        return ret;
      };
      const data = JSONtoarray(metadata);
      const createNftTxn = await algotxns.getCreateNftTxn(
        algodClient,
        deployer.addr,
        asset.name,
        false,
        "arc69",
        'ipfs://'+asset.ipfs+'#i',
        data,
      );
      console.log(await algotxns.signAndSubmit(algodClient, [createNftTxn], deployer));
      console.log(data);
      
    })
  );
})();