const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const Web3 = require('web3').default;

// Load ABIs
const raiGotchiAbiPath = path.join(__dirname, '../abifile', 'raigotchi_v2_abi.json');
const immidiateUseItemsAbiPath = path.join(__dirname, '../abifile', 'RaiGotchiImmidiateUseItems_abi.json');
const tokenAbiPath = path.join(__dirname, '../abifile', 'raigotchi_token_abi.json'); // Thêm ABI của hợp đồng token

const raiGotchiABI = JSON.parse(fs.readFileSync(raiGotchiAbiPath, 'utf8'));
const immidiateUseItemsABI = JSON.parse(fs.readFileSync(immidiateUseItemsAbiPath, 'utf8'));
const tokenABI = JSON.parse(fs.readFileSync(tokenAbiPath, 'utf8')); // Thêm ABI của hợp đồng token

// Contract addresses
const raiGotchiAddress = "0x5D31C0fF4AAF1C906B86e65fDd3A17c7087ab1E3";
const immidiateUseItemsAddress = "0x0beA242D563fc68f47FDf0A6444DaF701b80F013";
const tokenAddress = "0x774683C155327424f3d9b12a85D78f410F6E53A1"; // Địa chỉ hợp đồng token

// Web3 setup
const rpcURL = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const publicKey = process.env.PUBLIC_KEY;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

// Create contract instances
const raiGotchiContract = new web3.eth.Contract(raiGotchiABI, raiGotchiAddress);
const immidiateUseItemsContract = new web3.eth.Contract(immidiateUseItemsABI, immidiateUseItemsAddress);
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

async function getImidiateUseItemInfo(itemId) {
    try {
        const itemInfo = await immidiateUseItemsContract.methods.getImidiateUseItemInfo(itemId).call();
        const cleanItemInfo = {
            _name: itemInfo._name,
            _price: itemInfo._price,
            _stock: itemInfo._stock,
            _points: itemInfo._points,
            _timeExtension: itemInfo._timeExtension,
            _shield: itemInfo._shield
        };
        console.log(`[INFO] Item ${itemId} Info:`, cleanItemInfo);
        return cleanItemInfo;
    } catch (error) {
        console.error('[ERROR] Get Item Info:', error);
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

async function getPetShield(petId) {
    try {
        const shield = await raiGotchiContract.methods.petShield(petId).call();
        console.log(`[INFO] Pet ${petId} Shield:`, shield);
        return shield;
    } catch (error) {
        console.error('[ERROR] Get Pet Shield:', error);
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

async function buyImidiateUseItem(petId, itemId) {
    try {
        const receipt = await callContractMethod(immidiateUseItemsContract, 'buyImidiateUseItem', [petId, itemId], publicKey);
        console.log(`[PASSED] Buy Item Transaction Receipt:`, receipt.transactionHash);
        return receipt;
    } catch (error) {
        console.error('[ERROR] Buy Item Transaction:', error);
    }
}

(async () => {
    const petId = 4; 
    const deadPetId = 0; 
    const foodItemIds = [0, 1, 2]; 
    const revivalItemId = 3; 
    const decorativeItemId = 4; 
    const approvalAmount = web3.utils.toWei('20000', 'ether');

    // Approve the spending of tokens
    await approveSpending(immidiateUseItemsAddress, approvalAmount);

    // Check allowance
    const allowance = await checkAllowance(immidiateUseItemsAddress);
    if (allowance < approvalAmount) {
        console.log('[ERROR] Insufficient allowance');
        return;
    }

    // Test food items on a living pet
    for (const itemId of foodItemIds) {
        const alive = await isPetAlive(petId);
        
        console.log(`[INFO] Testing item ${itemId} on living pet ${petId}...`);
        const itemInfo = await getImidiateUseItemInfo(itemId);
        const petInfoBefore = await getPetInfo(petId);
        const shieldBefore = await getPetShield(petId);

        await buyImidiateUseItem(petId, itemId);

        console.log(`[INFO] Pet ${petId} Info after using item ${itemId}:`);
        const petInfoAfter = await getPetInfo(petId);
        const shieldAfter = await getPetShield(petId);

        console.log(`[INFO] Shield Before: ${shieldBefore}, After: ${shieldAfter}`);
        
        console.log ("\n\n-------------------------------------------------\n\n")
    }

    // Test revival item on a dead pet
    const alive = await isPetAlive(deadPetId);
    if (!alive) {
        console.log(`[INFO] Testing revival item ${revivalItemId} on dead pet ${deadPetId}...`);
        const petInfoBefore = await getPetInfo(deadPetId);

        // Test with a revival item (should succeed)
        await buyImidiateUseItem(deadPetId, revivalItemId);
        console.log(`[INFO] Pet ${deadPetId} Info after using revival item ${revivalItemId}:`);
        const petInfoAfter = await getPetInfo(deadPetId);
    

        // Check if the pet is now alive
        const revived = await isPetAlive(deadPetId);
        if (revived) {
            console.log(`[PASSED] Dead pet ${deadPetId} was successfully revived using item ${revivalItemId}.`);
        } else {
            console.log(`[FAILED] Dead pet ${deadPetId} was not revived using item ${revivalItemId}.`);
        }
    } else {
        console.log(`[SKIPPED] Pet ${deadPetId} is alive, skipping revival item test.`);
    }

    console.log ("\n\n-------------------------------------------------\n\n")

    // Test decorative item on a living pet (should not increase stats)
    const itemInfo = await getImidiateUseItemInfo(decorativeItemId);
    const petInfoBefore = await getPetInfo(petId);

    await buyImidiateUseItem(petId, decorativeItemId);
    console.log(`[INFO] Pet ${petId} Info after using decorative item ${decorativeItemId}:`);
    const petInfoAfter = await getPetInfo(petId);
})();
