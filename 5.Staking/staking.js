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
const raiGotchiItemAddress = "0xDf07437B8b9f72f3061eD02393CCa63d7388397c";
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

async function approveSpending(spender, amount) {
    try {
        const receipt = await callContractMethod(tokenContract, 'approve', [spender, amount], publicKey);
        console.log('[PASSED] Approve Transaction Receipt:', receipt.transactionHash);
    } catch (error) {
        console.error('[ERROR] Approve Transaction:', error);
    }
}

async function checkAllowance(spender) {
    try {
        const allowance = await tokenContract.methods.allowance(publicKey, spender).call();
        console.log(`[INFO] Allowance for ${spender}: ${allowance}`);
        return allowance;
    } catch (error) {
        console.error('[ERROR] Check Allowance:', error);
    }
}

async function getPoolInfo(poolId) {
    try {
        const pool = await stakingContract.methods.poolInfo(poolId).call();
        console.log(`[INFO] Pool ${poolId} Info:`, pool);
        return pool;
    } catch (error) {
        console.error('[ERROR] Get Pool Info:', error);
    }
}

async function isPetAlive(petId) {
    try {
        const alive = await raiGotchiContract.methods.isPetAlive(petId).call();
        console.log(`[INFO] Pet ${petId} is alive:`, alive);
        return alive;
    } catch (error) {
        console.error('[ERROR] Is Pet Alive:', error);
    }
}

async function isPetLocked(petId) {
    try {
        const locked = await raiGotchiContract.methods.isPetLocked(petId).call();
        console.log(`[INFO] Pet ${petId} is locked:`, locked);
        return locked;
    } catch (error) {
        console.error('[ERROR] Is Pet Locked:', error);
    }
}

async function stakePet(petId, poolId) {
    try {
        // Check if pet is alive
        const alive = await isPetAlive(petId);
        if (!alive) {
            console.error(`[ERROR] Pet ${petId} is not alive.`);
            return;
        }

        // Check if pet is locked
        const locked = await isPetLocked(petId);
        if (locked) {
            console.error(`[ERROR] Pet ${petId} is locked.`);
            return;
        }

      
        const pool = await getPoolInfo(poolId);
        /*
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime < pool.stakingStartTime || currentTime > pool.stakingEndTime) {
            console.error(`[ERROR] Pool ${poolId} is not within staking time.`);
            return;
        }
        if (pool.totalStakedSlot >= pool.maxSlotsInPool) {
            console.error(`[ERROR] Pool ${poolId} is full.`);
            return;
        }
        */

        // Stake the pet
        const receipt = await callContractMethod(stakingContract, 'stake', [petId, poolId], publicKey);
        console.log(`[PASSED] Stake Transaction Receipt:`, receipt.transactionHash);
        return receipt;
    } catch (error) {
        console.error('[ERROR] Stake Transaction:', error);
    }
}

async function unstakePet(petId, poolId) {
    const pool = await getPoolInfo(poolId);
    try {
        const receipt = await callContractMethod(stakingContract, 'unstake', [petId, poolId], publicKey);
        console.log(`[PASSED] Unstake Transaction Receipt:`, receipt.transactionHash);
        return receipt;
    } catch (error) {
        console.error('[ERROR] Unstake Transaction:', error);
    }
}

async function getPetInfo(petId) {
    try {
        const petInfo = await raiGotchiContract.methods.getPetInfo(petId).call();
        const cleanPetInfo = {
            _name: petInfo._name,
            _status: petInfo._status,
            _score: petInfo._score,
            _level: petInfo._level,
            _timeUntilStarving: petInfo._timeUntilStarving,
            _owner: petInfo._owner,
            _rewards: petInfo._rewards,
            _genes: petInfo._genes
        };
        console.log(`[INFO] Pet ${petId} Info:`, cleanPetInfo);
        return cleanPetInfo;
    } catch (error) {
        console.error('[ERROR] Get Pet Info:', error);
    }
}

(async () => {
    const petId = 0; // Replace with actual pet ID
    const poolId = 0; // Pool ID for staking
    const approvalAmount = web3.utils.toWei('100', 'ether'); // Amount to approve for staking
/*
    // Approve the spending of tokens
    await approveSpending(stakingAddress, approvalAmount);

    // Check allowance
    const allowance = await checkAllowance(stakingAddress);
    if (allowance < approvalAmount) {
        console.log('[ERROR] Insufficient allowance');
        return;
    }
    
    // Stake the pet
    console.log(`[INFO] Staking pet ${petId} in pool ${poolId}...`);
    await stakePet(petId, poolId);

    // Get pet info before unstaking
    console.log(`[INFO] Pet ${petId} Info before unstaking:`);
    await getPetInfo(petId);


    
    // Unstake the pet
    console.log(`[INFO] Unstaking pet ${petId} from pool ${poolId}...`);
    await unstakePet(petId, poolId);
*/
await getPetInfo(petId);
   
})();
