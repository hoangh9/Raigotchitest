const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const Web3 = require('web3').default;

// Load ABI
const raiGotchiAbiPath = path.join(__dirname, '../abifile', 'raigotchi_v2_abi.json');
const tokenAbiPath = path.join(__dirname, '../abifile', 'raigotchi_token_abi.json');
const raiGotchiBreedAbiPath = path.join(__dirname, '../abifile', 'raigotchi_breed_abi.json');

const raiGotchiABI = JSON.parse(fs.readFileSync(raiGotchiAbiPath, 'utf8'));
const tokenABI = JSON.parse(fs.readFileSync(tokenAbiPath, 'utf8'));
const raiGotchiBreedABI = JSON.parse(fs.readFileSync(raiGotchiBreedAbiPath, 'utf8'));

// Contract addresses
const raiGotchiAddress = "0x5D31C0fF4AAF1C906B86e65fDd3A17c7087ab1E3";
const tokenAddress = "0x774683C155327424f3d9b12a85D78f410F6E53A1";
const raiGotchiBreedAddress = "0x879d6612865bE87Ca3732C0289F9b702e00F6062"; 

// Web3 setup
const rpcURL = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const publicKey = process.env.PUBLIC_KEY;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

// Create contract instances
const raiGotchiContract = new web3.eth.Contract(raiGotchiABI, raiGotchiAddress);
const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
const raiGotchiBreedContract = new web3.eth.Contract(raiGotchiBreedABI, raiGotchiBreedAddress);

async function callContractMethod(contract, method, params, from) {
    const gasPrice = await web3.eth.getGasPrice();
    const tx = {
        from: from,
        to: contract.options.address,
        gas: await contract.methods[method](...params).estimateGas({ from: from }),
        gasPrice: gasPrice,
        data: contract.methods[method](...params).encodeABI()
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    return web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}

async function breedPets(petId1, petId2) {
    try {
        // Call the breed function
        const receipt = await callContractMethod(raiGotchiBreedContract, 'breed', [petId1, petId2], publicKey);
        console.log(`[PASSED] Breed Transaction Receipt:`, receipt.transactionHash);
        return receipt;
    } catch (error) {
        console.error('[ERROR] Breed Transaction:', error);
    }
}

async function checkBreedStatus(breedId) {
    try {
        // Check if the breeding has completed
        const breedFinishTime = await raiGotchiBreedContract.methods.breedFinishTime(breedId).call();
        const currentTime = Math.floor(Date.now() / 1000);

        if (currentTime >= breedFinishTime) {
            console.log(`[INFO] Breeding process has finished for breed ID ${breedId}.`);
        } else {
            console.log(`[INFO] Breeding process is still ongoing for breed ID ${breedId}.`);
        }
    } catch (error) {
        console.error('[ERROR] Checking Breed Status:', error);
    }
}

(async () => {
    const petId1 = 0; 
    const petId2 = 4;

    // Breed the pets
    console.log(`[INFO] Attempting to breed pet ${petId1} with pet ${petId2}...`);
    const breedReceipt = await breedPets(petId1, petId2);

    if (breedReceipt) {
        const breedId = breedReceipt.events.StartBreed.returnValues.breedId;
        console.log(`[INFO] Breed started with ID ${breedId}.`);

        // Check the breed status after some time (replace the time here as necessary)
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds

        await checkBreedStatus(breedId);
    }
})();
