#!/usr/bin/env python3
"""
Lab 5.3 — Send a type-2 tx and decompose the fee
Chay SAU KHI da gui 0.001 coin bang MetaMask (type-2) va co tx hash.

Cach dung:
  python fee_decompose.py --tx 0x<hash>
  # hoac dat bien moi truong:
  export TX_HASH=0x...
  python fee_decompose.py

Yeu cau: pip install web3
RPC: TrustKeys L1 (chainId 11968, PoA) — can ExtraDataToPOAMiddleware
"""

import os
import argparse
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

TRUSTKEYS_RPC = "https://l1testnet.trustkeys.network"


def connect(rpc: str) -> Web3:
    w3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={"timeout": 15}))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    if not w3.is_connected():
        raise ConnectionError(f"Khong ket noi duoc RPC: {rpc}")
    return w3


def decompose(w3: Web3, tx_hash: str):
    print(f"Connected chainId={w3.eth.chain_id}")
    print(f"tx hash = {tx_hash}")

    rcpt = w3.eth.get_transaction_receipt(tx_hash)
    tx   = w3.eth.get_transaction(tx_hash)
    blk  = w3.eth.get_block(rcpt["blockNumber"])

    # cac truong quan trong
    print(f"\n[receipt]  blockNumber={rcpt['blockNumber']}  status={rcpt['status']}  gasUsed={rcpt['gasUsed']}")
    print(f"[receipt]  type={rcpt.get('type')}  effectiveGasPrice={rcpt.get('effectiveGasPrice')}")
    print(f"[tx]       type={tx.get('type')}  maxFeePerGas={tx.get('maxFeePerGas')}  maxPriorityFeePerGas={tx.get('maxPriorityFeePerGas')}")
    print(f"[block]    baseFeePerGas={blk.get('baseFeePerGas')}")

    base_fee  = blk["baseFeePerGas"]            # wei
    gas_used  = rcpt["gasUsed"]
    eff_price = rcpt["effectiveGasPrice"]       # = baseFee + min(tip, maxFee - baseFee)
    max_fee   = tx.get("maxFeePerGas")
    max_prio  = tx.get("maxPriorityFeePerGas")

    paid   = gas_used * eff_price
    burned = gas_used * base_fee                # roi luu thong
    tip    = gas_used * (eff_price - base_fee)  # ve proposer

    print(f"\n[fee decomposition]  gasUsed={gas_used:,}")
    print(f"  baseFee           = {base_fee} wei = {base_fee/1e9:.9f} gwei")
    print(f"  maxFeePerGas      = {max_fee} wei = {max_fee/1e9:.9f} gwei" if max_fee is not None else "  maxFeePerGas      = N/A")
    print(f"  maxPriorityFee    = {max_prio} wei = {max_prio/1e9:.9f} gwei" if max_prio is not None else "  maxPriorityFee    = N/A")
    print(f"  effectiveGasPrice = {eff_price} wei = {eff_price/1e9:.9f} gwei")
    if max_fee is not None and max_prio is not None:
        expected_eff = base_fee + min(max_prio, max_fee - base_fee)
        print(f"  check eff = base + min(prio, maxFee-base) = {expected_eff} -> {'OK' if expected_eff==eff_price else 'MISMATCH'}")

    print(f"\n  paid   = gasUsed * effPrice        = {paid:,} wei = {paid/1e18:.12f} coin")
    print(f"  burned = gasUsed * baseFee          = {burned:,} wei  (leaves circulation / roi luu thong)")
    print(f"  tip    = gasUsed*(effPrice-baseFee) = {tip:,} wei  (to proposer)")
    print(f"\n  invariant: paid == burned + tip ?  {paid == burned + tip}  ({paid} == {burned} + {tip})")
    if paid == burned + tip:
        print("  -> CHECK OK: dem dong nay cho TA (Lab 5.3).")
    else:
        print("  -> CHECK FAIL: kiem tra lai RPC / block.")

    # Q4/Q5 helper
    print(f"\n[notes]")
    print(f"  - Neu tang maxFee nhung giu maxPriority khong doi, effPrice {'KHONG doi' if (max_fee is not None and max_prio is not None and max_prio < max_fee - base_fee) else 'co the doi neu maxFee dang la nut that'} (xem Q4).")
    print(f"  - Simple transfer EOA->EOA thuong dung dung 21,000 gas (xem Q5). gasUsed thuc te = {gas_used:,}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Lab 5.3 fee decomposition")
    parser.add_argument("--tx", default=os.environ.get("TX_HASH", ""), help="Transaction hash 0x...")
    parser.add_argument("--rpc", default=TRUSTKEYS_RPC, help="RPC URL")
    args = parser.parse_args()

    if not args.tx or not args.tx.startswith("0x") or len(args.tx) != 66:
        parser.error("Thieu --tx 0x... (66 ky tu). Vi du: python fee_decompose.py --tx 0xabc...  (copy tu MetaMask)")

    w3 = connect(args.rpc)
    decompose(w3, args.tx)
