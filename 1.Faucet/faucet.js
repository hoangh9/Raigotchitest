const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const Web3 = require('web3').default;


const abiPath = path.join(__dirname,'../abifile','faucet_abi.json');
const tokenABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

const contractAddress = "0x937529264EBF13a0203cfAf7bBf09a3822f6636a";
const rpcURL = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));
const contract = new web3.eth.Contract(tokenABI, contractAddress);

async function Mint() {
  // login wallet
  const wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(wallet);
  const accountAddress = wallet.address;
  
  const toAddress = process.env.PUBLIC_KEY;

  try {
    const gasPrice = await web3.eth.getGasPrice();
    const transaction = await contract.methods.getRaiToken(toAddress).send({
      from: accountAddress, 
      gas: 100000,         
      gasPrice: gasPrice    
    });

    console.log('Result Transaction:', transaction);
  } catch (error) {
    console.error('Error transaction:', error);
  }
}

Mint();
