const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const Web3 = require('web3').default;

// Load ABI từ file JSON
const raigotchiTokenAbiPath = path.join(__dirname, '../abifile','raigotchi_token_abi.json');
const raigotchiTokenABI = JSON.parse(fs.readFileSync(raigotchiTokenAbiPath, 'utf8'));

const raigotchiTokenAddress = "0x774683C155327424f3d9b12a85D78f410F6E53A1";
const rpcURL = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const publicKey = process.env.PUBLIC_KEY;

const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));
const raigotchiTokenContract = new web3.eth.Contract(raigotchiTokenABI, raigotchiTokenAddress);

async function checkTokenFunctions() {
    // Đăng nhập vào ví
    const wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(wallet);

    try {
        // Kiểm tra chức năng tổng cung
        const totalSupply = await raigotchiTokenContract.methods.totalSupply().call();
        console.log('[INFO] Total Supply:', totalSupply);

        // Kiểm tra số dư của ví
        const balance = await raigotchiTokenContract.methods.balanceOf(publicKey).call();
        console.log('[INFO] Balance of', publicKey, ':', balance);

        // Get current gas price
        const gasPrice = await web3.eth.getGasPrice();

        // Chuyển token
        const transferAmount = web3.utils.toWei('100', 'ether');
        try {
            const transferTx = await raigotchiTokenContract.methods.transfer("0x790B54910633b1d8a7AdDe3a90710Ec0484025Cb", transferAmount).send({
                from: publicKey,
                gas: 100000,
                gasPrice: gasPrice
            });
            console.log('[PASSED] Transfer. Transaction:', transferTx.transactionHash);
        } catch (error) {
            console.error('[ERROR] Transfer:', error);
        }

        // Burn token
        try {
            const burnTx = await raigotchiTokenContract.methods.burn(transferAmount).send({
                from: publicKey,
                gas: 100000,
                gasPrice: gasPrice
            });
            console.log('[PASSED] Burn. Transaction:', burnTx.transactionHash);
        } catch (error) {
            console.error('[ERROR] Burn:', error);
        }

        // Approve token
        const approveAmount = web3.utils.toWei('500', 'ether');
        try {
            const approveTx = await raigotchiTokenContract.methods.approve("0x790B54910633b1d8a7AdDe3a90710Ec0484025Cb", approveAmount).send({
                from: publicKey,
                gas: 100000,
                gasPrice: gasPrice
            });
            console.log('[PASSED] Approve. Transaction:', approveTx.transactionHash);
        } catch (error) {
            console.error('[ERROR] Approve:', error);
        }

        // Allowance
        try {
            const allowance = await raigotchiTokenContract.methods.allowance(publicKey, "0x790B54910633b1d8a7AdDe3a90710Ec0484025Cb").call();
            console.log('[INFO] Allowance:', allowance);
        } catch (error) {
            console.error('[ERROR] Allowance:', error);
        }

    } catch (error) {
        console.error('[ERROR] Transaction:', error);
    }
}

checkTokenFunctions();
