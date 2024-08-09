const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const Web3 = require('web3').default;
const BN = require('bn.js');

// Load ABI từ file JSON
const raigotchiTokenAbiPath = path.join(__dirname, '../abifile','raigotchi_token_abi.json');
const raiGotchiV2AbiPath = path.join(__dirname, '../abifile','raigotchi_v2_abi.json');

const raigotchiTokenABI = JSON.parse(fs.readFileSync(raigotchiTokenAbiPath, 'utf8'));
const raiGotchiV2ABI = JSON.parse(fs.readFileSync(raiGotchiV2AbiPath, 'utf8'));

const raigotchiTokenAddress = "0x774683C155327424f3d9b12a85D78f410F6E53A1";
const raiGotchiV2Address = "0x5D31C0fF4AAF1C906B86e65fDd3A17c7087ab1E3";

const rpcURL = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const publicKey = process.env.PUBLIC_KEY;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

const raigotchiTokenContract = new web3.eth.Contract(raigotchiTokenABI, raigotchiTokenAddress);
const raiGotchiV2Contract = new web3.eth.Contract(raiGotchiV2ABI, raiGotchiV2Address);

async function sendTransaction(tx) {
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}

async function getGasPrice() {
    return await web3.eth.getGasPrice();
}

async function approveToken(amountToApprove, accountAddress) {
    const gasPrice = await getGasPrice();
    return await raigotchiTokenContract.methods.approve(raiGotchiV2Address, amountToApprove).send({
        from: accountAddress,
        gas: 100000,
        gasPrice: gasPrice
    });
}

async function mintPet(accountAddress) {
    const gasPrice = await getGasPrice();
    const gasEstimate = await raiGotchiV2Contract.methods.mint().estimateGas({ from: accountAddress });

    const tx = {
        from: accountAddress,
        to: raiGotchiV2Address,
        gas: gasEstimate,
        gasPrice: gasPrice,
        data: raiGotchiV2Contract.methods.mint().encodeABI()
    };

    return await sendTransaction(tx);
}

async function setPetName(petId, petName, accountAddress) {
    const gasPrice = await getGasPrice();
    return await raiGotchiV2Contract.methods.setPetName(petId, petName).send({
        from: accountAddress,
        gas: 100000,
        gasPrice: gasPrice
    });
}

async function getPetInfo(petId) {
    return await raiGotchiV2Contract.methods.getPetInfo(petId).call();
}

async function mintTokenAndSetName() {
    // Đăng nhập vào ví
    const wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(wallet);
    const accountAddress = publicKey;

    const amountToApprove = web3.utils.toWei('20000', 'ether'); // Chuyển đổi 20000 token sang wei

    try {
        await approveToken(amountToApprove, accountAddress);
        console.log('[PASSED] Approve Token to contract.');

        const totalpetBefore = parseInt(await raiGotchiV2Contract.methods._tokenIds().call());
        console.log('[CHECK] Total Pet before mint:', totalpetBefore);

        const mintReceipt = await mintPet(accountAddress);
        console.log('[PASSED] MINT PET SUCCESS. Transaction:', mintReceipt.transactionHash);

        const totalpetAfter = parseInt(await raiGotchiV2Contract.methods._tokenIds().call());
        console.log('[CHECK] Total Pet after mint:', totalpetAfter);

        if (totalpetAfter > totalpetBefore) {
            console.log('[PASSED] Minting increased total pet count.');
        } else {
            console.error('[FAILED] Minting did not increase total pet count.');
            return;
        }

        const newPetId = totalpetAfter - 1; // ID of the newly minted pet

        const newPetName1 = "New Name";
        await setPetName(newPetId, newPetName1, accountAddress);
        console.log('[PASSED] Set Pet Name.');

        let petInfo = await getPetInfo(newPetId);
        console.log('[INFO] Pet Info after first name change:', petInfo);
        if (petInfo[0] !== newPetName1) {
            console.error('[FAILED] First name change was not successful.');
            return;
        }

    

    } catch (error) {
        console.error('[ERROR] Transaction:', error);
    }
}

// Thực hiện hàm mintTokenAndSetName
mintTokenAndSetName();
