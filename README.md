# Clique Smart Contracts

This repository contains the smart contract logic for **Clique** — a rotating crypto savings protocol inspired by darets. The goal of this repo is to develop and test the pot mechanics that power the core functionality of the protocol.

Try running some of the following tasks:

### 1. Clone the repo

```shell
git clone https://github.com/ciaranglansford/clique-contracts.git
cd clique-contracts

npm install
npx hardhat compile
npx hardhat test
npx hardhat node     # Start local test network

npx hardhat run [path to deploy script] --network localhost
    or
npx hardhat ignition deploy [./ignition/modules/Lock.js]
```

