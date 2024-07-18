import axios from "axios";
import {wrapper} from 'axios-cookiejar-support';
import {CookieJar} from 'tough-cookie';
import fs from "fs";
import pLimit from 'p-limit';
import {ethers, Wallet} from "ethers"
import Logger from "@youpaichris/logger";
import * as path from "path";
const logger = new Logger();
const successPath = "success.txt";
const claimDataPath = "claimData.txt";
const failPath = "fail.txt";
const toAddress = "接受代币的地址"
function ensureDirectoryExistence(filePath) {
    const dir = path.dirname(filePath);
    if (fs.existsSync(dir)) {
        return true;
    }
    ensureDirectoryExistence(dir);
    fs.mkdirSync(dir);
}

// Ensure directory and create files
[successPath, claimDataPath, failPath].forEach(filePath => {
    ensureDirectoryExistence(filePath);
    fs.writeFileSync(filePath, '', { flag: 'w' }); // 'w' flag will create an empty file or truncate an existing file
    logger.debug(`Created: ${filePath}`)
});

const successWallets = fs
    .readFileSync(successPath, "utf8")
const provider = new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");
const abi =[
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "toAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenAmount",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            },
            {
                "internalType": "string",
                "name": "transId",
                "type": "string"
            }
        ],
        "name": "claimUXLINKToAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]
async function login(client, account) {
    try {
        const message = `Welcome to UXLINK!

Click to sign in and this request will not trigger a blockchain transaction or cost any gas fees.

Wallet address:${account.address}

 Nonce:
6d4db5ff0c117864a02827bad3c361b9`
        // const message = `Welcome to UXLINK!\n\nClick to sign in and this request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:${account.address}\n\n Nonce:\n${generateRandomString(32)}`
        const signed = await account.signMessage(message)
        const data = {
            address: account.address,
            aliasName: 'MetaMask',
            walletType: 1,
            message: message,
            signed: signed
        }
        const headers = {
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            Origin: 'https://reward.uxlink.io',
            Pragma: 'no-cache',
            Referer: 'https://reward.uxlink.io/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            accept: 'application/json',
            authorization: '',
            'content-type': 'application/json',
            'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'x-language': 'en-US',
            'x-platform': 'reward',
            'x-version': '1.0.0',
            'x-walletplatform': 'Chrome',
            Accept: '*/*',
            'Accept-Encoding': 'gzip, deflate, br'
        }
        //const data =`address=${address}&message=Welcome!\n\nSign this message to access Gamma's full feature set.\n\nAs always, by using Gamma, you agree to our terms of use: https://gamma.io/terms\n\nDomain: gamma.io\nBlockchain: bitcoin\nAccount: ${address}\nNonce: ${csrfToken}&signature=${signature}&redirect=false&csrfToken=${csrfToken}&callbackUrl=https://gamma.io/ordinals/collections/forever-bullish&json=true`
        const response = await client.post(
            'https://api.uxlink.io/user/wallet/verify',
            data,
            {
                headers: headers
            }
        );
        return response.data;
    } catch (e) {
        logger.error(`Error Status: ${e?.response?.status} \nError Response: ${e?.response?.data}`)
        return e?.response?.data
    }
}

async function getClaimData(client, toAddress,authorization) {
    const url ="https://api.uxlink.io/nft/uxlink/third/wallet/claim"
    const data = {walletAddress:toAddress, riskSign: ''}
    const headers = {
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        Origin: 'https://reward.uxlink.io',
        Pragma: 'no-cache',
        Referer: 'https://reward.uxlink.io/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        accept: 'application/json',
        authorization: authorization,
        'content-type': 'application/json',
        'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'x-language': 'en-US',
        'x-platform': 'reward',
        'x-version': '1.0.0',
        'x-walletplatform': 'Chrome',
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br'
    }

    const response = await client.post(
        url,
        data,
        {
            headers: headers
        }
    );
    return response.data;
}


async function claim(privateKey) {
    const jar = new CookieJar();
    const client = wrapper(axios.create({jar}));
    const wallet = new Wallet(privateKey,provider)
    const myAddress = wallet.address;

    if (successWallets.includes(myAddress)) {
        logger.debug(`${myAddress} 已经领取过空投`)
        return;
    }
    let accessToken;

    let loginResponse;
    for (let i = 0; i < 15; i++) {
        try {
            loginResponse = await login(client, wallet)
            logger.debug(`${myAddress} ${JSON.stringify(loginResponse)}`)
            if (loginResponse?.data?.accessToken) {
                accessToken = loginResponse?.data?.accessToken
                break
            }
        } catch (e) {
            logger.error(`${myAddress} ${e}`)
        }
    }

    if (!accessToken) {
        logger.debug(`${myAddress} 登陆失败`)
        fs.appendFileSync(
            failPath,
            `${myAddress}----${privateKey}\n`
        );
        return
    }
    let claimData;
    for (let i = 0; i < 15; i++) {
        try {
            claimData = await getClaimData(client, toAddress,accessToken)
            logger.debug(`${myAddress} ${JSON.stringify(claimData)}`)
            if (claimData?.data?.signature) {
                fs.appendFileSync(
                    claimDataPath,
                    `${myAddress}----${privateKey}----${JSON.stringify(claimData)}\n`
                );
                break
            }else if(claimData?.code === 10002003){
                logger.debug(`${myAddress} 没有空投`)
                return
            }
        } catch (e) {
            logger.error(`${myAddress} ${e}`)
        }
    }
    if (!claimData?.data?.signature) {
        logger.debug(`${myAddress} 获取claim数据失败 ${claimData}`)
        fs.appendFileSync(
            failPath,
            `${myAddress}----${privateKey}\n`
        );
        return
    }

    const amount = claimData?.data?.amount
    const contractToken = claimData?.data?.contractToken
    const signature = "0x" +claimData?.data?.signature
    const transId = claimData?.data?.transId

    const claimContract = new ethers.Contract(contractToken, abi, wallet)
    try{
        const tx = await claimContract.claimUXLINKToAddress(toAddress, amount,signature,transId)
        // 等待交易上链
        const receipt = await tx.wait()
        const hash = receipt.transactionHash
        logger.success(`${myAddress} ${hash}`)
        fs.appendFileSync(
            successPath,
            `${myAddress}----${privateKey}----${hash}\n`
        );
    }catch (e) {
        logger.error(`${myAddress} ${e}`)
        fs.appendFileSync(
            failPath,
            `${myAddress}----${privateKey}\n`
        );
    }
}

async function main() {
    //读取keys.txt
    const keys = fs
        .readFileSync('keys.txt', "utf8")
        .split(/\r?\n/)
        .filter((key) => key);


    const limit = pLimit(5);
    const tasks = keys.map((key) => {
        const [address, privateKey] = key.split('----');

        return limit(() => claim(privateKey));
    });

    await Promise.all(tasks);
    logger.success(`done`)
}

main().catch(
    (e) => console.error(e)
)