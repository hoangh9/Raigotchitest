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
const stakingAddress = "0x599f4d128b59670Fa2c29043C5F8ad9073653903";
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

async function getMiningTools() {
    try {
        const tools = await stakingContract.methods.miningToolUsed(publicKey).call();
        console.log(`[INFO] You have ${tools.length} mining tools.`);
        return tools.length;
    } catch (error) {
        console.error('[ERROR] Get Mining Tools:', error);
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

async function getMiningPowerMultiplier() {
    try {
        const multiplier = await stakingContract.methods.miningPowerMultiplier().call();
        console.log(`[INFO] Your mining power multiplier is: ${multiplier}.`);
        return multiplier;
    } catch (error) {
        console.error('[ERROR] Get Mining Power Multiplier:', error);
    }
}

async function logCurrentTime() {
    const currentTime = new Date();
    const currentTimeGMT7 = new Date(currentTime.getTime() + 7 * 60 * 60 * 1000);
    const currentTimeString = currentTimeGMT7.toISOString().replace('T', ' ').replace('Z', '');
    console.log(`[INFO] Your current time is: ${currentTimeString} GMT+7.`);
}


async function calculateNextMiningTime() {
    try {
        const lastMiningTime = await stakingContract.methods.lastMiningTime(publicKey).call();
        const totalMiningChargeTime = await stakingContract.methods.totalMiningChargeTime(publicKey).call();
        
        const nextMiningTimeUTC = parseInt(lastMiningTime) + parseInt(totalMiningChargeTime);
        const currentTimeUTC = Math.floor(Date.now() / 1000);

        // Convert to a  GMT+7
        const nextMiningDateGMT7 = new Date(nextMiningTimeUTC * 1000 + 7 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', '');

        if (nextMiningTimeUTC > currentTimeUTC) {
            const timeRemaining = nextMiningTimeUTC - currentTimeUTC;
            console.log(`[INFO] Your mining tools will be ready in ${timeRemaining} seconds (at ${nextMiningDateGMT7} GMT+7).`);
        } else {
            console.log(`[INFO] Your mining tools are ready to mine now (next mining time was ${nextMiningDateGMT7} GMT+7).`);
        }

        return nextMiningTimeUTC;
    } catch (error) {
        console.error('[ERROR] Calculate Next Mining Time:', error);
    }
}



async function calculateMiningReward() {
    try {
        const totalMiningPower = await stakingContract.methods.totalMiningPower(publicKey).call();
        const miningPowerMultiplier = await stakingContract.methods.miningPowerMultiplier().call();
        const baseDenominator = 1000; // Hoặc giá trị thực tế từ hợp đồng Solidity

        const rewardPoints = (parseInt(totalMiningPower) * parseInt(miningPowerMultiplier)) / baseDenominator;
        console.log(`[INFO] You will earn ${rewardPoints} points after mining.`);
        return rewardPoints;
    } catch (error) {
        console.error('[ERROR] Calculate Mining Reward:', error);
    }
}


async function getTotalMiningPower() {
    try {
        const totalMiningPower = await stakingContract.methods.totalMiningPower(publicKey).call();
        console.log(`[INFO] Your total mining power is: ${totalMiningPower}`);
        return totalMiningPower;
    } catch (error) {
        console.error('[ERROR] Get Total Mining Power:', error);
    }
}



async function removeMiningTool(toolId) {
    try {
        const receipt = await callContractMethod(stakingContract, 'removeMiningTool', [toolId], publicKey);
        console.log('[PASSED] Remove Mining Tool Transaction Receipt:', receipt.transactionHash);
    } catch (error) {
        console.error('[ERROR] Remove Mining Tool Transaction:', error);
    }
}

(async () => {

  
    removeMiningTool(1) 
       // Check current mining points
       await getMiningPoints();
   
       // Get total mining power
       await getTotalMiningPower();
   
       // Get mining power multiplier
       await getMiningPowerMultiplier();
   
       // Calculate potential reward from mining
       await calculateMiningReward();
        // Log the current time in UTC
        await logCurrentTime();
       // Calculate next mining time
       await calculateNextMiningTime();

})();
