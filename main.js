const hermez = require('@hermeznetwork/hermezjs')
const async = require('async')
const EXAMPLES_WEB3_URL = 'http://hermez-public-998653595.eu-west-1.elb.amazonaws.com:8545'
const EXAMPLES_HERMEZ_API_URL = 'http://hermez-public-998653595.eu-west-1.elb.amazonaws.com:8086'
const EXAMPLES_HERMEZ_ROLLUP_ADDRESS = '0x10465b16615ae36F350268eb951d7B0187141D3B'
const EXAMPLES_HERMEZ_WDELAYER_ADDRESS = '0x8EEaea23686c319133a7cC110b840d1591d9AeE0'
// 0x0A0ce75Dc160cf628EaFc239b27D254C1EB38537
const privKey1 = '0xdfc16e3470df6cc8297ffbf6c54d72acd17c3b61702cc045ae8e3564d746ffea'
// 0xdCd914A8Dffa2497f94Cfe4C5eA2EdeE8C37BFE9
const privKey2 = '0xb614db72f7561a409fb442b58f3a6c2d9ca754aa9dbd237d57587096da221cf9'
const axios = require('axios')

function setupHermez () {
  hermez.Providers.setProvider(EXAMPLES_WEB3_URL)
  hermez.CoordinatorAPI.setBaseApiUrl(EXAMPLES_HERMEZ_API_URL)
  hermez.Constants._setContractAddress(hermez.Constants.ContractNames.Hermez, EXAMPLES_HERMEZ_ROLLUP_ADDRESS)
  hermez.Constants._setContractAddress(hermez.Constants.ContractNames.WithdrawalDelayer, EXAMPLES_HERMEZ_WDELAYER_ADDRESS)
  hermez.TxPool.initializeTransactionPool()
}

async function _sendL2Tx (opts) {
  const { accountFrom, toIdx, amount, fee } = opts
  console.log('_sendL2Tx BEGIN')
  console.log('accountFrom - ', accountFrom)
  console.log('toIdx - ', toIdx)
  console.log('amount - ', amount)
  console.log('fee - ', fee)
  // fees: (next) => {
  //   const state = await hermez.CoordinatorAPI.getState()
  //   console.log('state = ', state)
  //   next(state.recommendedFee)
  // },
  async.auto({
    wallet: async (res, next) => {
      const privateKey = '0xdfc16e3470df6cc8297ffbf6c54d72acd17c3b61702cc045ae8e3564d746ffea'
      console.log('res - '.res)
      console.log('privateKey ', res.privateKey)
      const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privateKey })
      console.log('wallet = ', wallet)
      next(null, wallet.hermezWallet)
    },
    send: ['wallet', async (res, next) => {
      const l2TxTransfer = {
        type: '10',
        from: accountFrom.accountIndex,
        to: toIdx,
        amount: amount,
        userFee: fee
      }
      console.log('l2TxTransfer - ', l2TxTransfer)
      const transferResponse = await hermez.Tx.generateAndSendL2Tx(l2TxTransfer, res.wallet, accountFrom.token)
      next(null, transferResponse)
    }]
  }, (err, res) => {
    console.log('JUMPED')
    console.log('err - ', err)
    console.log('res - ', res)
  })
}

async function latestBatch () {
  const baseUrl = 'http://hermez-public-998653595.eu-west-1.elb.amazonaws.com:8086/'
  const stateUrl = baseUrl + 'state'
  const batches = await axios.get(stateUrl)
  console.log('latestBatch - ', batches.data.network.lastBatch.batchNum)
}

async function getHeightTransactions (ix) {
  const baseUrl = 'http://hermez-public-998653595.eu-west-1.elb.amazonaws.com:8086/'
  const heightForTransactions = baseUrl + `full-batches/${ix}`
  const fullBatch = await axios.get(heightForTransactions)
  console.log('fullBatch - ', fullBatch.data)
}

async function deposit (opts) {
  const { privKey, amount, token } = opts
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey })
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = hermezWallet.hermezEthereumAddress
  const res = await hermez.Tx.deposit(
    amount,
    hermezEthereumAddress,
    token,
    hermezWallet.publicKeyCompressedHex,
    { type: 'WALLET', privateKey: privKey1 }
  )
  console.log('res  ------ ', res)
}
async function getFee () {
  const state = await hermez.CoordinatorAPI.getState()
  console.log('recommendedFee - ', state.recommendedFee)
  // fees are made in the token of the transaction
}

async function main () {
  const tokenToDeposit = 0
  const token = await hermez.CoordinatorAPI.getTokens()
  // console.log('tokens - ', token)
  const tokenERC20 = token.tokens[tokenToDeposit]
  console.log('tokenERC20 = ', tokenERC20)

  // Create 1st wallet
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey1 })
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // Create 2nd wallet
  const wallet2 = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey2 })
  const hermezWallet2 = wallet2.hermezWallet
  const hermezEthereumAddress2 = wallet2.hermezEthereumAddress

  // set amount to deposit
  const amountDeposit = hermez.Utils.getTokenAmountBigInt('0.5', 18)
  console.log('amountDeposit - ', amountDeposit)
  await deposit({ privKey: privKey1, amount: amountDeposit, token: tokenERC20 })
  await deposit({ privKey: privKey2, amount: amountDeposit, token: tokenERC20 })

  console.log('hermezEthereumAddress - ', hermezEthereumAddress)
  console.log('hermezEthereumAddress2 - ', hermezEthereumAddress2)

  const account1 = await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress)
  const account2 = await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress2)

  console.log('account1 - ', JSON.stringify(account1, 6, 2))
  console.log('account2 - ', JSON.stringify(account2, 6, 2))

  // const account1Balance = account1.accounts[0].balance
  // console.log('account1Balance - ', account1Balance)

  // // fee computation
  // const state = await hermez.CoordinatorAPI.getState()
  // console.log(state.recommendedFee)
  // // fees are made in the token of the transaction
  // // e.g if sending usdt need to pay usdt

  // // L2 transfer e.g hez_eth to hez_usdt

  const infoAccountSenderAccounts = await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id])
  const infoAccountSender = infoAccountSenderAccounts.accounts[0]
  // console.log('infoAccountSenderAccounts ', infoAccountSenderAccounts)
  const infoAccountReceiverAccounts = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress2, [tokenERC20.id]))
  const infoAccountReceiver = infoAccountReceiverAccounts.accounts[0]

  console.log('infoAccountReceiverAccounts ', infoAccountReceiverAccounts)

  console.log('infoAccountSender', infoAccountSender)
  console.log('infoAccountReceiver - ', infoAccountReceiver)
  const amountToTransfer = hermez.Utils.getTokenAmountBigInt('5', 18)
  const userFee = 0
  // send from 1 to 2
  try {
    console.log('infoAccountSender  ', infoAccountSender)
    console.log('infoAccountReceiver ', infoAccountReceiver)
    await _sendL2Tx({ accountFrom: infoAccountSender, toIdx: infoAccountReceiver.accountIndex, amount: amountToTransfer, fee: userFee })
  } catch (err) {
    console.log('err - ', err)
  }
  // const l2TxTransfer = {
  //   type: '10',
  //   from: infoAccountSender.accountIndex,
  //   to: infoAccountReceiver.accountIndex,
  //   amount: amountToTransfer,
  //   userFee
  // }

  // const transferResponse = await hermez.Tx.generateAndSendL2Tx(l2TxTransfer, hermezWallet, infoAccountSender.token)
  // console.log('transferResponse = ', transferResponse)

  // // transaction staus
  // const txTransferPool = await hermez.CoordinatorAPI.getPoolTransaction('0x020000000001020000000001')
  // console.log('txTransferPool - ', txTransferPool)
  // console.log('transfer state  -  ', txTransferPool.state)

  // get transaction confirmations
  // try {
  //   const txConfirmations = await hermez.CoordinatorAPI.getHistoryTransaction('0x020000000001020000000001')
  //   console.log('txConfirmations - ', txConfirmations)
  // } catch (err) {
  //   console.log('err - ', err)
  // }
}
async function getHEZBalance (addr, cb) {
  const { accounts } = await hermez.CoordinatorAPI.getAccounts(addr)
  const tokenSymbol = 'ETH'
  if (!accounts) return cb(new Error('ERR_API_COIN_CLIENT: no account available'))
  console.log('accounts for - ', addr, accounts)
  const tetherToken = accounts.filter((account) => account.token?.symbol === tokenSymbol)
  cb(null, tetherToken)

  // this._getERC20Balance(addr, OMG_TOKEN_CONTRACT, (err, balance) => {
  //   if (err) return cb(err)
  //   cb(null, this._OMGfromUnit(balance))
  // })
}
setupHermez()
getFee()
main()
// getHEZBalance('hez:0xdCd914A8Dffa2497f94Cfe4C5eA2EdeE8C37BFEj9', (err, res) => {
//   console.log('err, res - ', err, res)
// })

// getHeightTransactions(673)
// latestBatch()
