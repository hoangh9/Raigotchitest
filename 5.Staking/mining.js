const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const Web3 = require('web3').default;

// Load ABIs
const raiGotchiAbiPath = path.join(__dirname, '../abifile', 'raigotchi_v2_abi.json');
const raiGotchiItemAbiPath = path.join(__dirname, '../abifile', 'raigotchi_item_abi.json');
const stakingAbiPath = path.join(__dirname, '../abifile', 'raigotchi_staking_abi.json');
const tokenAbiPath = path.join(__dirname, '../abifile', 'raigotchi_token_abi.json'); // Thêm ABI của hợp đồng token

const raiGotchiABI = JSON.parse(fs.readFileSync(raiGotchiAbiPath, 'utf8'));
const raiGotchiItemABI = JSON.parse(fs.readFileSync(raiGotchiItemAbiPath, 'utf8'));
const stakingABI = JSON.parse(fs.readFileSync(stakingAbiPath, 'utf8'));
const tokenABI = JSON.parse(fs.readFileSync(tokenAbiPath, 'utf8')); // Thêm ABI của hợp đồng token

// Contract addresses
const raiGotchiAddress = "0x5D31C0fF4AAF1C906B86e65fDd3A17c7087ab1E3";
const raiGotchiItemAddress = "0x60D52cbF057893c029DfE28b156AD896e1fb9968";
const stakingAddress = "0xE5575c7e6428e5c61b8564E39c489175aa6ACfdE";
const tokenAddress = "0x774683C155327424f3d9b12a85D78f410F6E53A1"; // Địa chỉ hợp đồng token

// Web3 setup
const rpcURL = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const publicKey = process.env.PUBLIC_KEY;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

// Create contract instances
const raiGotchiContract = new web3.eth.Contract(raiGotchiABI, raiGotchiAddress);
const raiGotchiItemContract = new web3.eth.Contract(raiGotchiItemABI, raiGotchiItemAddress);
const stakingContract = new web3.eth.Contract(stakingABI, stakingAddress);
const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress); // Thêm instance của hợp đồng token

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

async function addMiningTool(toolId) {
    try {
        const receipt = await callContractMethod(stakingContract, 'addMiningTool', [toolId], publicKey);
        console.log('[PASSED] Add Mining Tool Transaction Receipt:', receipt.transactionHash);
    } catch (error) {
        console.error('[ERROR] Add Mining Tool Transaction:', error);
    }
}

async function mining() {
    try {
        const receipt = await callContractMethod(stakingContract, 'mining', [], publicKey);
        console.log('[PASSED] Mining Transaction Receipt:', receipt.transactionHash);
    } catch (error) {
        console.error('[ERROR] Mining Transaction:', error);
    }
}

async function getMiningPoints() {
    try {
        const points = await stakingContract.methods.miningPoints(publicKey).call();
        console.log(`[INFO] You have ${points} mining points.`);
        return points;
    } catch (error) {
        console.error('[ERROR] Get Mining Points:', error);
    }
}

async function approveItemSpending(toolId) {
    try {
        const receipt = await callContractMethod(raiGotchiItemContract, 'approve', [stakingAddress, toolId], publicKey);
        console.log('[PASSED] Approve Item Transaction Receipt:', receipt.transactionHash);
    } catch (error) {
        console.error('[ERROR] Approve Item Transaction:', error);
    }
}

(async () => {
    const toolIds = [1, 2,3]; 

    // Add mining tools
    
    for (let toolId of toolIds) {
        await addMiningTool(toolId);
    }
    
    // Perform mining
    console.log('[INFO] Performing mining...');
    await mining();

    // Check mining points
    console.log('[INFO] Checking mining points...');
    const points = await getMiningPoints();
    console.log(`[INFO] You have earned ${points} mining points.`);
})();
