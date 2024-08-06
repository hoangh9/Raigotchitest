const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const Web3 = require('web3').default;

// Load ABIs
const raiGotchiAbiPath = path.join(__dirname, '../abifile', 'raigotchi_v2_abi.json');
const attackAbiPath = path.join(__dirname, '../abifile', 'RaiGotchiAttack.json');

const raiGotchiABI = JSON.parse(fs.readFileSync(raiGotchiAbiPath, 'utf8'));
const attackABI = JSON.parse(fs.readFileSync(attackAbiPath, 'utf8'));

// Contract addresses
const raiGotchiAddress = "0x06b669E335ea67e062E3d01169a2CA7985dBAd27";
const attackAddress = "0xaf949E88f6A393aCC3a322d2b07a55A0fCeF2442";

// Web3 setup
const rpcURL = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const publicKey = process.env.PUBLIC_KEY;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

// Create contract instances
const raiGotchiContract = new web3.eth.Contract(raiGotchiABI, raiGotchiAddress);
const attackContract = new web3.eth.Contract(attackABI, attackAddress);

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

async function attackPet(fromId, toId) {
    try {
        const receipt = await callContractMethod(attackContract, 'attack', [fromId, toId], publicKey);
        console.log('[PASSED] Attack Transaction Receipt:', receipt.transactionHash);

        // Get the transaction receipt to determine the outcome
        const transactionReceipt = await web3.eth.getTransactionReceipt(receipt.transactionHash);

        // Parse logs to get the Attack event data
        const attackEvent = transactionReceipt.logs.find(log => log.address.toLowerCase() === attackAddress.toLowerCase());
        const decodedEvent = web3.eth.abi.decodeLog(
            [
                { type: 'uint256', name: 'attacker' },
                { type: 'uint256', name: 'winner' },
                { type: 'uint256', name: 'loser' },
                { type: 'uint256', name: 'scoresWon' },
                { type: 'uint256', name: 'prizeDebt' }
            ],
            attackEvent.data,
            attackEvent.topics.slice(1)
        );

        const { attacker, winner, loser, scoresWon, prizeDebt } = decodedEvent;
        console.log(`Winner: ${winner}, Loser: ${loser}, Scores Won: ${scoresWon}, Prize Debt: ${prizeDebt}`);


    } catch (error) {
        console.error('[ERROR] Attack Transaction:', error);
    }
}



async function getPetInfo(petId) {
    try {
        const petInfo = await raiGotchiContract.methods.getPetInfo(petId).call();
        console.log(`[INFO] Pet ${petId} Info:`, petInfo);
    } catch (error) {
        console.error('[ERROR] Get Pet Info:', error);
    }
}

// Example Usage
(async () => {
    const fromPetId = 7; // Replace with actual pet ID
    const toPetId = 16; // Replace with actual pet ID

    // Perform attack
    console.log('[INFO] Performing attack...');
    await attackPet(fromPetId, toPetId);

})();
