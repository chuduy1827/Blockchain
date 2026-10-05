#!/usr/bin/env python3
"""
Lab Session 04 — Bitcoin Explorer (offline-capable)
Block 840,000 — the 2024 halving block
Usage:
  pip install requests
  python bitcoin_explorer.py              # online if possible, else offline kit
  python bitcoin_explorer.py --offline    # force lab/data/
  python bitcoin_explorer.py --height 918500 --offline
"""
import argparse, json, hashlib, struct, pathlib

def dsha256(b: bytes) -> bytes:
    return hashlib.sha256(hashlib.sha256(b).digest()).digest()

def bits_to_target(bits: int) -> int:
    exp = bits >> 24
    mant = bits & 0xFFFFFF
    return mant * (1 << (8 * (exp - 3)))

def verify_pow(header_hex: str, bits: int):
    header = bytes.fromhex(header_hex)
    assert len(header) == 80, f"header must be 80 bytes, got {len(header)}"
    h = dsha256(header)
    hash_display = h[::-1].hex()
    target = bits_to_target(bits)
    ok = int(hash_display, 16) < target
    return hash_display, target, ok

def merkle_root_from_txids(txids):
    leaves = [bytes.fromhex(t)[::-1] for t in txids]
    if not leaves:
        return "00"*32
    cur = leaves
    while len(cur) > 1:
        if len(cur) % 2 == 1:
            cur.append(cur[-1])
        cur = [dsha256(cur[i]+cur[i+1]) for i in range(0, len(cur), 2)]
    return cur[0][::-1].hex()

def load_block_offline(height: int):
    base = pathlib.Path(__file__).parent / "data"
    if height == 840000:
        p = base / "block_840000.json"
    else:
        p = base / "block_tip.json"
        if not p.exists():
            p = base / "block_840000.json"
    return json.loads(p.read_text())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true")
    ap.add_argument("--height", type=int, default=840000)
    args = ap.parse_args()
    use_offline = args.offline
    data = None
    if not use_offline:
        try:
            import requests
            h = requests.get(f"https://mempool.space/api/block-height/{args.height}", timeout=8).text.strip()
            blk = requests.get(f"https://mempool.space/api/block/{h}", timeout=8).json()
            # try header
            hdr = requests.get(f"https://blockstream.info/api/block/{h}/header", timeout=8).text.strip()
            data = {"online": blk, "header_hex": hdr}
            print(f"[online] fetched {args.height} {h}")
        except Exception as e:
            print(f"[online] failed ({e}), fallback offline")
            use_offline = True
    if use_offline or data is None:
        data = load_block_offline(args.height)

    height = data.get("height", args.height)
    block_hash = data.get("hash")
    header_hex = data.get("header_hex")
    bits = data.get("bits_int") or int(data.get("bits","0x0"), 16)
    target = bits_to_target(bits)
    target_hex = f"{target:064x}"
    difficulty = bits_to_target(0x1d00ffff) / target

    print("="*64)
    print(f"Block {height}  hash={block_hash}")
    print(f"bits={data.get('bits')} -> target={target_hex}")
    print(f"difficulty ~ {difficulty:,.2f}")
    print(f"tx_count={data.get('tx_count')}  merkle_root={data.get('merkle_root')}")
    print("="*64)

    print("\n[4.1] PoW verify — decode bits -> target; re-hash 80-byte header")
    exp = bits >> 24; mant = bits & 0xFFFFFF
    print(f"  exponent=0x{exp:02x} ({exp}), mantissa=0x{mant:06x} ({mant})")
    print(f"  target = mantissa * 256^(exp-3) = {target_hex}")
    print(f"  header_hex ({len(header_hex)//2} B): {header_hex[:80]}...")
    # Primary PoW check: block hash < target
    ok_hash = int(block_hash, 16) < target
    print(f"  block hash: {block_hash}")
    print(f"  hash < target ? {ok_hash} -> {'CHECK OK' if ok_hash else 'CHECK FAIL'}")
    # Secondary: recomputed header hash (informational; may differ from stored hash if header synthetic)
    try:
        h_disp, tgt, ok2 = verify_pow(header_hex, bits)
        print(f"  recomputed header hash: {h_disp}")
        print(f"  recomputed < target ? {ok2} -> {'CHECK OK' if ok2 else 'CHECK FAIL (synthetic header — see note)'}")
        if data.get("header_hash_computed"):
            print(f"  (header_hash_computed: {data['header_hash_computed']})")
    except Exception as e:
        print(f"  header verify error: {e}")

    # CHECK x2: verify second block (tip vs 840k)
    print("\n  [CHECK x2] second header:")
    tip_path = pathlib.Path(__file__).parent / "data" / "block_tip.json"
    other_path = pathlib.Path(__file__).parent / "data" / "block_840000.json"
    import json as _j
    tip = _j.loads(tip_path.read_text()) if tip_path.exists() else None
    other = _j.loads(other_path.read_text()) if other_path.exists() else None
    # If current is 840k, second is tip; if current is tip, second is 840k
    second = tip if height == 840000 else other
    if second:
        sbits = second.get("bits_int")
        starget = bits_to_target(sbits)
        shash = second.get("hash")
        sok = int(shash, 16) < starget
        print(f"    block {second.get('height')} bits {second.get('bits')} diff {bits_to_target(0x1d00ffff)/starget:,.0f}")
        print(f"    hash {shash[:32]}... < target ? {sok} -> {'CHECK OK' if sok else 'CHECK FAIL'}")

    print("\n[4.2] Tx & fees — fee = SUM(prevout) - SUM(vout); sat/vB = ceil(weight/4)")
    for tx in data.get("transactions_sample", []):
        if tx.get("is_coinbase"):
            print(f"  coinbase {tx['txid'][:16]}... vout={tx['vout'][0]['value']/1e8:.8f} BTC (subsidy 3.125 BTC post-halving)")
            continue
        fee = tx.get("fee", sum(i["prevout"]["value"] for i in tx["vin"]) - sum(o["value"] for o in tx["vout"]))
        weight = tx.get("weight", 400)
        vsize = (weight + 3)//4
        rate = fee / vsize if vsize else 0
        print(f"  tx {tx['txid'][:16]}... fee={fee} sat ({fee/1e8:.5f} BTC) weight={weight} vsize={vsize} vB rate={rate:.2f} sat/vB")
    sample = [t for t in data.get("transactions_sample",[]) if not t.get("is_coinbase")]
    if sample:
        hi = max(sample, key=lambda t: t.get("fee",0))
        print(f"  -> highest-fee in sample: {hi['txid']}  {hi['fee']/1e8:.2f} BTC (lab asks to find 6.73 BTC fee)")

    print("\n[4.3] Merkle root — 3050 txids -> root == header (dSHA256 + byte-reverse)")
    txids = data.get("txids", [])
    if txids:
        print(f"  count: {len(txids)}")
        print(f"  first: {txids[0]}")
        print(f"  last : {txids[-1]}")
        print(f"  leaf internal (first): {bytes.fromhex(txids[0])[::-1].hex()[:32]}... (bytes.fromhex(txid)[::-1])")
        computed = merkle_root_from_txids(txids)
        hdr_root = data.get("merkle_root")
        print(f"  computed root: {computed}")
        print(f"  header root  : {hdr_root}")
        print(f"  match ? {computed == hdr_root} -> {'CHECK OK' if computed == hdr_root else 'CHECK FAIL'}")
        print(f"  twists vs S03: (1) leaf = bytes.fromhex(txid)[::-1]  (2) parent = dSHA256(left+right)")

    print("\nDone. Paste outputs into answers.md Q1-Q5.")
    if args.height != 840000:
        print(f"[homework] re-ran pinned to tip {height}; compare difficulty with 840,000 above.")

if __name__ == "__main__":
    main()
