#!/usr/bin/env python3
"""
Homework 1 — So sanh base-fee series TrustKeys L1 vs Sepolia o 2 thoi diem
Chay:
  python compare_chains.py                          # snapshot hien tai ca 2 chain
  python compare_chains.py --out snapshot1.json     # luu de so sanh sau
  # vai gio sau chay lai:
  python compare_chains.py --compare snapshot1.json

Yeu cau: pip install web3
Ghi chu: ca 2 chain deu can ExtraDataToPOAMiddleware (PoA / clique-extraData).
"""

import argparse
import json
import time
from datetime import datetime, timezone
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

TRUSTKEYS_RPC = "https://l1testnet.trustkeys.network"
SEPOLIA_RPC   = "https://ethereum-sepolia-rpc.publicnode.com"
# fallback neu publicnode bi rate-limit:
SEPOLIA_FALLBACK = "https://rpc.sepolia.org"


def connect(rpc: str) -> Web3:
    w3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={"timeout": 15}))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    if not w3.is_connected():
        raise ConnectionError(f"Khong ket noi duoc RPC: {rpc}")
    return w3


def snapshot_chain(rpc: str, label: str, n_blocks: int = 20):
    w3 = connect(rpc)
    blk = w3.eth.get_block("latest")
    fh  = w3.eth.fee_history(n_blocks, "latest", [10, 50, 90])
    avg = sum(fh["gasUsedRatio"]) / len(fh["gasUsedRatio"]) if fh["gasUsedRatio"] else 0
    return {
        "label": label,
        "rpc": rpc,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "chainId": w3.eth.chain_id,
        "headBlock": blk["number"],
        "gasLimit": blk["gasLimit"],
        "gasUsed": blk["gasUsed"],
        "baseFeePerGas": blk.get("baseFeePerGas"),
        "oldestBlock": fh["oldestBlock"],
        "baseFeePerGas_series": fh["baseFeePerGas"],  # len N+1, phan tu cuoi = nextBaseFee
        "gasUsedRatio": fh["gasUsedRatio"],            # len N
        "reward_p50_gwei": [ (r[1]/1e9 if len(r)>1 else 0) for r in (fh.get("reward") or []) ],
        "nextBaseFee": fh["baseFeePerGas"][-1],
        "avgGasUsedRatio": avg,
        "verdict": "BUSY" if avg > 0.5 else "quiet",
    }


def print_snapshot(s):
    print(f"\n[{s['label']}]  {s['timestamp']}  chainId={s['chainId']}  head={s['headBlock']}")
    print(f"  gasLimit={s['gasLimit']:,}  gasUsed={s['gasUsed']:,} ({s['gasUsed']/s['gasLimit']*100:.2f}%)")
    bf = s['baseFeePerGas']
    print(f"  baseFeePerGas(head) = {bf} wei = {bf/1e9:.9f} gwei" if bf is not None else "  baseFeePerGas = None")
    print(f"  nextBaseFee (feeHistory[-1]) = {s['nextBaseFee']} wei = {s['nextBaseFee']/1e9:.9f} gwei")
    print(f"  avg gasUsedRatio (20 blocks) = {s['avgGasUsedRatio']:.2%} -> {s['verdict']}")
    print(f"  {'block':>8}  {'baseFee(gwei)':>14}  {'gasUsedRatio':>12}  {'p50(gwei)':>10}")
    for i, ratio in enumerate(s["gasUsedRatio"]):
        b = s["oldestBlock"] + i
        base_gwei = s["baseFeePerGas_series"][i] / 1e9
        p50 = s["reward_p50_gwei"][i] if i < len(s["reward_p50_gwei"]) else 0
        print(f"  {b:>8}  {base_gwei:>14.9f}  {ratio:>12.2%}  {p50:>10.4f}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Homework 1: compare TrustKeys vs Sepolia")
    parser.add_argument("--n", type=int, default=20, help="So block fee_history")
    parser.add_argument("--out", help="Luu snapshot ra JSON (de so sanh sau)")
    parser.add_argument("--compare", help="Duong dan snapshot JSON truoc do de so sanh")
    args = parser.parse_args()

    # snapshot hien tai
    results = []
    for rpc, label in [(TRUSTKEYS_RPC, "TrustKeys L1"), (SEPOLIA_RPC, "Sepolia")]:
        try:
            s = snapshot_chain(rpc, label, n_blocks=args.n)
        except Exception as e:
            print(f"[{label}] loi voi {rpc}: {e}")
            if label == "Sepolia":
                print(f"  Thu fallback {SEPOLIA_FALLBACK} ...")
                s = snapshot_chain(SEPOLIA_FALLBACK, label + " (fallback)", n_blocks=args.n)
            else:
                raise
        print_snapshot(s)
        results.append(s)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\nDa luu snapshot -> {args.out}  (chay lai sau vai gio va dung --compare de so sanh)")

    if args.compare:
        print(f"\n{'='*60}")
        print(f"So sanh voi snapshot cu: {args.compare}")
        with open(args.compare, encoding="utf-8") as f:
            old = json.load(f)
        for cur in results:
            prev = next((x for x in old if x["label"].split()[0] == cur["label"].split()[0]), None)
            if not prev:
                continue
            print(f"\n[{cur['label']}]")
            print(f"  truoc: head {prev['headBlock']}  nextBaseFee {prev['nextBaseFee']/1e9:.9f} gwei  avgRatio {prev['avgGasUsedRatio']:.2%}")
            print(f"  nay:   head {cur['headBlock']}  nextBaseFee {cur['nextBaseFee']/1e9:.9f} gwei  avgRatio {cur['avgGasUsedRatio']:.2%}")

    print("\nGoi y viet Homework 1 (nua trang):")
    print("  - TrustKeys L1: gasUsedRatio ~1-3% << target 15M -> baseFee dinh floor vai wei (Q2).")
    print("  - Sepolia: gasUsedRatio dao dong 20-70%, baseFee bien thien +-12.5%/block theo EIP-1559.")
    print("  - Giai thich: testnet lop hoc (cung vuot cau) vs testnet cong cong (cau thuc, theo gio).")
