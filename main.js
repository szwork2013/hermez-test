const hermez = require('@hermeznetwork/hermezjs')

async function main () {
  const EXAMPLES_WEB3_URL = 'http://hermez-public-998653595.eu-west-1.elb.amazonaws.com:8545'
  const EXAMPLES_HERMEZ_API_URL = 'http://hermez-public-998653595.eu-west-1.elb.amazonaws.com:8086'
  const EXAMPLES_HERMEZ_ROLLUP_ADDRESS = '0x10465b16615ae36F350268eb951d7B0187141D3B'
  const EXAMPLES_HERMEZ_WDELAYER_ADDRESS = '0x8EEaea23686c319133a7cC110b840d1591d9AeE0'

  // 0x0A0ce75Dc160cf628EaFc239b27D254C1EB38537
  const privKey1 = '0xdfc16e3470df6cc8297ffbf6c54d72acd17c3b61702cc045ae8e3564d746ffea'
  // 0xdCd914A8Dffa2497f94Cfe4C5eA2EdeE8C37BFEj9
  const privKey2 = '0xb614db72f7561a409fb442b58f3a6c2d9ca754aa9dbd237d57587096da221cf9'

  hermez.Providers.setProvider(EXAMPLES_WEB3_URL)
  hermez.CoordinatorAPI.setBaseApiUrl(EXAMPLES_HERMEZ_API_URL)
  hermez.Constants._setContractAddress(hermez.Constants.ContractNames.Hermez, EXAMPLES_HERMEZ_ROLLUP_ADDRESS)
  hermez.Constants._setContractAddress(hermez.Constants.ContractNames.WithdrawalDelayer, EXAMPLES_HERMEZ_WDELAYER_ADDRESS)
  hermez.TxPool.initializeTransactionPool()

  const tokenToDeposit = 0
  const token = await hermez.CoordinatorAPI.getTokens()
  const tokenERC20 = token.tokens[tokenToDeposit]

  // Create 1st wallet
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey1 })
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // Create 2nd wallet
  const wallet2 = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey2 })
  const hermezWallet2 = wallet2.hermezWallet
  const hermezEthereumAddress2 = wallet2.hermezEthereumAddress

  console.log('hermezWallet - ', hermezWallet)
  console.log('hermezWallet2 - ', hermezWallet2)

  console.log('hermezEthereumAddress - ', hermezEthereumAddress)
  console.log('hermezEthereumAddress2 - ', hermezEthereumAddress2)

  // set amount to deposit
  const amountDeposit = hermez.Utils.getTokenAmountBigInt('0.1', 18)

  // // perform deposit account 1
  // await hermez.Tx.deposit(
  //   amountDeposit,
  //   hermezEthereumAddress,
  //   tokenERC20,
  //   hermezWallet.publicKeyCompressedHex,
  //   { type: 'WALLET', privateKey: privKey1 }
  // )

  // // perform deposit account 2
  // await hermez.Tx.deposit(
  //   amountDeposit,
  //   hermezEthereumAddress2,
  //   tokenERC20,
  //   hermezWallet2.publicKeyCompressedHex,
  //   { type: 'WALLET', privateKey: privKey2 }
  // )

  const account1 = await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress)
  const account2 = await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress2)
  console.log('account1 - ', account1)
  console.log('account2 - ', account2)
  const account1ByIdx = await hermez.CoordinatorAPI.getAccount(`hez:${tokenERC20.symbol}:256`)
  console.log('account1ByIdx = ', account1ByIdx)
}

main()
