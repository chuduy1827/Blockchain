#!/usr/bin/env python3
"""
Lab 5.2 — Read the chain with web3.py
Chay:  python fee_history.py
Yeu cau: pip install web3
RPC: TrustKeys L1 https://l1testnet.trustkeys.network  chainId 11968 (EIP-1559, PoA clique)
Fallback so sanh: Sepolia https://ethereum-sepolia-rpc.publicnode.com

Lam tuan tu theo worksheet:
  1. ket noi read-only
  2. eth_getBlockByNumber latest -> baseFeePerGas, gasLimit, gasUsed
  3. eth_getBalance (dia chi cua ban hoac dia chi mau)
  4. eth_feeHistory 20 blocks -> in 20 dong base fee + verdict BUSY/quiet
"""

from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

# --- cau hinh ---
TRUSTKEYS_RPC = "https://l1testnet.trustkeys.network"
SEPOLIA_RPC   = "https://ethereum-sepolia-rpc.publicnode.com"  # dung cho Homework 1
# dia chi vi du trong worksheet; thay bang dia chi cua ban de kiem tra balance that
EXAMPLE_ADDRESS = "0x5A351A9280e2e5b9324408EC5769D0745d7aB512"

# neu ban muon dung dia chi cua chinh minh, dat bien moi truong:
#   export MY_ADDRESS=0x...
import os
MY_ADDRESS = os.environ.get("MY_ADDRESS", EXAMPLE_ADDRESS)


def connect(rpc: str) -> Web3:
    w3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={"timeout": 15}))
    # TrustKeys L1 va Sepolia deu la PoA (extraData 97 bytes) -> bat buoc middleware
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    if not w3.is_connected():
        raise ConnectionError(f"Khong ket noi duoc RPC: {rpc}")
    return w3


def lab52(w3: Web3, label: str = "TrustKeys L1"):
    print(f"\n{'='*60}")
    print(f"Connected to {label}  chainId={w3.eth.chain_id}")
    # --- eth_getBlockByNumber latest ---
    blk = w3.eth.get_block("latest")
    print("\n[eth_getBlockByNumber latest]")
    print(f"  number        = {blk['number']}")
    print(f"  gasLimit      = {blk['gasLimit']:,}")
    print(f"  gasUsed       = {blk['gasUsed']:,}  ({blk['gasUsed']/blk['gasLimit']*100:.2f}% full)")
    base_fee = blk.get("baseFeePerGas")
    if base_fee is not None:
        print(f"  baseFeePerGas = {base_fee} wei = {base_fee/1e9:.9f} gwei  <- EIP-1559 active")
    else:
        print("  baseFeePerGas = None (EIP-1559 chua active tren chain nay)")
    print(f"  #txs          = {len(blk['transactions'])}")
    # extraData length check (PoA)
    extra = blk.get("extraData", b"")
    print(f"  extraData len = {len(extra)} bytes")

    # --- eth_getBalance ---
    print("\n[eth_getBalance]")
    try:
        bal = w3.eth.get_balance(Web3.to_checksum_address(MY_ADDRESS))
        print(f"  address = {MY_ADDRESS}")
        print(f"  balance = {bal} wei = {bal/1e18:.9f} coin")
    except Exception as e:
        print(f"  (skip balance) {e}")

    # --- eth_feeHistory ---
    print("\n[eth_feeHistory] last 20 blocks (base fee series)")
    print(f"  {'block':>8}  {'baseFee(gwei)':>14}  {'gasUsedRatio':>12}  {'tip p50(gwei)':>14}")
    try:
        fh = w3.eth.fee_history(20, "latest", [10, 50, 90])
        oldest = fh["oldestBlock"]
        bases  = fh["baseFeePerGas"]   # len N+1
        ratios = fh["gasUsedRatio"]    # len N
        rewards = fh.get("reward")     # len N, moi phan tu [p10, p50, p90]

        for i in range(len(ratios)):
            b = oldest + i
            base_gwei = bases[i] / 1e9
            ratio = ratios[i]
            # p50 la phan tu thu 1 trong [10,50,90]
            p50_gwei = 0
            if rewards and i < len(rewards) and len(rewards[i]) > 1:
                p50_gwei = rewards[i][1] / 1e9
            print(f"  {b:>8}  {base_gwei:>14.9f}  {ratio:>12.2%}  {p50_gwei:>14.4f}")

        # phan tu du N+1: base fee du kien cho block tiep theo
        next_base = bases[-1]
        print(f"\n  next block's projected baseFee = {next_base} wei = {next_base/1e9:.9f} gwei")
        print(f"  (baseFeePerGas len={len(bases)} = N+1, gasUsedRatio len={len(ratios)} = N)")

        avg = sum(ratios) / len(ratios) if ratios else 0
        verdict = "BUSY" if avg > 0.5 else "quiet"
        print(f"  average gasUsedRatio over window = {avg:.2%} -> chain is {verdict}")

        # CHECK theo worksheet
        checks_ok = len(bases) == 21 and len(ratios) == 20
        print(f"\n  CHECK baseFee len N+1 & ratio len N: {'OK' if checks_ok else 'FAIL'}")
        print(f"  CHECK printed 20 lines: {'OK' if len(ratios)==20 else 'FAIL'}")

        return {"block": blk, "fee_history": fh, "avg_ratio": avg}
    except Exception as e:
        import traceback
        print(f"  fee_history failed: {e}")
        traceback.print_exc()
        return None


if __name__ == "__main__":
    # Mac dinh chay TrustKeys L1 (Lab 5.2). De so sanh Sepolia, chay Homework 1.
    import argparse
    parser = argparse.ArgumentParser(description="Lab 5.2 fee_history")
    parser.add_argument("--rpc", default=TRUSTKEYS_RPC, help="RPC URL")
    parser.add_argument("--label", default="TrustKeys L1", help="Chain label")
    parser.add_argument("--address", default=MY_ADDRESS, help="Address to check balance")
    args = parser.parse_args()
    if args.address != MY_ADDRESS:
        MY_ADDRESS = args.address

    w3 = connect(args.rpc)
    lab52(w3, label=args.label)
    print("\nDone. Luu output nay de tra loi Q2/Q3 va dem cho TA (CHECK = OK).")
