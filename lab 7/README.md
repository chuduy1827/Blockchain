# Lab 07 — Token Standards (Hardhat + TrustKeys)

## Project layout
```
tokens/
  contracts/ClassToken.sol   # ERC20 + ERC20Capped + ERC20Permit (cap 1M CTK, _update override)
  contracts/ClassBadge.sol   # ERC721 + Ownable, on-chain base64 JSON + SVG
  lab/ClassToken_remix.sol   # single-file Remix build (imports pinned @5.0.2)
  lab/ClassBadge_remix.sol   # single-file Remix build (imports pinned @5.0.2)
  test/ClassToken.test.js    # name/symbol/decimals, cap, transfer, revert, approve/transferFrom, invariant, permit BONUS
  test/ClassBadge.test.js    # mint/owner, EmptyName, tokenURI decode, nonexistent revert, multi-mint
  scripts/deploy-token.js    # npx hardhat run scripts/deploy-token.js --network trustkeys
  scripts/deploy-badge.js    # npx hardhat run scripts/deploy-badge.js --network trustkeys
  scripts/interact-token.js  # TOKEN=0x... TO=0x... [AMOUNT=100] npx hardhat run scripts/interact-token.js --network trustkeys
  scripts/read-badge.js      # REGISTRY=0x... TOKEN_ID=0 npx hardhat run scripts/read-badge.js --network trustkeys
  hardhat.config.js          # solidity 0.8.24, evmVersion paris, optimizer 200, chainId 11968
  package.json / .env.example
```

## Setup
```bash
cd tokens
npm i
cp .env.example .env  # then put ONLY your dedicated test PRIVATE_KEY in .env
npx hardhat compile
npx hardhat test
```

Never paste a real mnemonic or funded key into `.env`. Use a dedicated MetaMask test account funded by the instructor.

## TrustKeys
- RPC: https://l1testnet.trustkeys.network
- chainId: 11968
- MetaMask → Import token → paste ClassToken address → send 100 CTK with `interact-token.js`
- Decode badge: `REGISTRY=0xYourBadge TOKEN_ID=0 npx hardhat run scripts/read-badge.js --network trustkeys`

## Why OpenZeppelin 5.0.2 + evmVersion paris
Newer OZ (5.6+) emits the Cancun `mcopy` opcode; TrustKeys' Geth targets `paris`, so pinning `5.0.2` and `evmVersion: "paris"` keeps bytecode compatible.

## Answers Q1–Q7 (short)
- **Q1** Audited, battle-tested, gas-reviewed OZ saves bespoke bugs and keeps the interface standard.
- **Q2** `1000000000000000000` = 1 CTK; `decimals` is display metadata, on-chain everything is integer base units.
- **Q3** `transfer` does not invoke the recipient; `approve` + `transferFrom` lets a DEX pull inside its own tx. Infinite `approve(2**256-1)` lets a compromised spender drain the whole balance.
- **Q4** JSON and SVG live in the contract (storage/bytecode) as `data:` URIs; skipping IPFS avoids a pinning service and keeps metadata available as long as the chain is.
- **Q5** `_safeMint`/`safeTransferFrom` checks `onERC721Received` on contract recipients so NFTs are not stranded in contracts that cannot move them.
- **Q6** Without an explorer, confirm via `balanceOf` / `allowance` view calls and `Transfer` logs — same data MetaMask shows.
- **Q7** Permit is bound to `chainId`, `verifyingContract`, per-owner `nonce`, and `deadline`; replay on another chain or a second time fails.
