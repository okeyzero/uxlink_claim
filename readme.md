# uxlink领取脚本 ![twitter](https://img.shields.io/twitter/follow/0xNaiXi?style=social)

网站 https://reward.uxlink.io/claim

## 运行截图

![img.png](img.png)

## 安装

在项目根目录下，执行以下命令来安装项目依赖：

```bash
npm i
```

首先，您需要在 keys.txt 文件中输入相关的信息。请确保按照下面的格式添加您的信息（例如，地址、私钥等），一行一个：

```bash
地址----私钥
私钥
```

## 修改数据

1. 13行 `const toAddress = "接受代币的地址"` 把 `接受代币的地址` 修改成你的 大号地址 这样所有代币会自动领取到这个地址
2. 32行 `const provider = new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");`  把 `https://arb1.arbitrum.io/rpc` 修改成 更好的rpc 防止频率限制等问题

## 运行

然后，运行以下命令来启动程序：

```bash
node main.js
```

## 请我一杯咖啡

如果你觉得这个项目对你有帮助，可以请我喝一杯咖啡，谢谢！

SOL地址: EfDZm8wdkFU7JD8ACeWeJ54xaBVPWiZUKKmLSkN6WUzu

evm地址: 0xD70C7F06C07152Acb16D20012572250F57EEA624
