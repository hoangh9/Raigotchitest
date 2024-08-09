const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const Web3 = require('web3').default;

// Load ABI
const raiGotchiAbiPath = path.join(__dirname, '../abifile', 'raigotchi_v2_abi.json');
const raiGotchiABI = JSON.parse(fs.readFileSync(raiGotchiAbiPath, 'utf8'));

// Contract address
const raiGotchiAddress = "0x5D31C0fF4AAF1C906B86e65fDd3A17c7087ab1E3";

// Web3 setup
const rpcURL = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const publicKey = process.env.PUBLIC_KEY;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

// Create contract instance
const raiGotchiContract = new web3.eth.Contract(raiGotchiABI, raiGotchiAddress);

async function transferPet(petId, toAddress) {
    try {
        const gasPrice = await web3.eth.getGasPrice();
        const tx = {
            from: publicKey,
            to: raiGotchiContract.options.address,
            gas: await raiGotchiContract.methods.transferFrom(publicKey, toAddress, petId).estimateGas({ from: publicKey }),
            gasPrice: gasPrice,
            data: raiGotchiContract.methods.transferFrom(publicKey, toAddress, petId).encodeABI()
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log(`[PASSED] Transfer Transaction Receipt:`, receipt.transactionHash);
        return receipt;
    } catch (error) {
        console.error('[ERROR] Transfer Transaction:', error);
    }
}

async function isPetLocked(petId) {
    try {
        const locked = await raiGotchiContract.methods.isPetLocked(petId).call(); // Thay thế `c` bằng hàm chính xác nếu cần
        console.log(`[INFO] Pet ${petId} is locked:`, locked);
        return locked;
    } catch (error) {
        console.error('[ERROR] Is Pet Locked:', error);
        throw error;
    }
}

(async () => {
    const petId = 1; // Thay bằng ID Pet cụ thể
    const toAddress = "0x5D31C0fF4AAF1C906B86e65fDd3A17c7087ab1E3"; // Địa chỉ nhận Pet

    // Check if the pet is locked
    console.log(`[INFO] Checking if pet ${petId} is locked...`);
    const locked = await isPetLocked(petId);

    if (!locked) {
        console.log(`[INFO] Pet ${petId} is not locked. Proceeding with transfer...`);
        //await transferPet(petId, toAddress);
    } else {
        console.log(`[INFO] Pet ${petId} is locked. Transfer aborted.`);
    }
})();
