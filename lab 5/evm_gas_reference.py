#!/usr/bin/env python3
"""
Homework 2 — Tra gas cost tren evm.codes va giai thich ti le
Chay:
  python evm_gas_reference.py              # in bang
  python evm_gas_reference.py --json       # in JSON de dan vao md

Nguon chuan: https://www.evm.codes  (Berlin EIP-2929 + London EIP-3529)
Cac gia tri duoi day la gia tri thuc te sau cac EIP do.
"""

import argparse
import json

# Bang tong hop tu evm.codes (kiem tra lai tren evm.codes khi nop)
TABLE = [
    {
        "opcode": "ADD",
        "gas": 3,
        "nhom": "veryLow",
        "ghi_chu": "Chi cong 2 so tren stack, khong cham state. Re nhat.",
    },
    {
        "opcode": "SLOAD (cold)",
        "gas": 2100,
        "nhom": "cold access (EIP-2929)",
        "ghi_chu": "Lan dau doc slot trong tx: doc trie + nap access list.",
    },
    {
        "opcode": "SLOAD (warm)",
        "gas": 100,
        "nhom": "warm access",
        "ghi_chu": "Da cham slot do trong tx -> cache, chi con 100 gas.",
    },
    {
        "opcode": "SSTORE 0 -> 0 (warm, khong doi)",
        "gas": 100,
        "nhom": "warm no-op",
        "ghi_chu": "Ghi lai gia tri cu (warm) -> re nhat cua SSTORE.",
    },
    {
        "opcode": "SSTORE 0 -> non-zero (tao moi)",
        "gas": 22100,
        "nhom": "20,000 + 2,100 cold",
        "ghi_chu": "Cap phat storage moi -> dat nhat.",
    },
    {
        "opcode": "SSTORE non-zero -> non-zero (sua)",
        "gas": 2900,
        "nhom": "warm: 2800+100 / cold: 5000",
        "ghi_chu": "Sua gia tri da co; warm re hon cold.",
    },
]

EXPLANATION = (
    "ADD re nhat (3 gas) vi chi cong hai so tren stack, khong cham dia hay trie. "
    "SLOAD dat hon ~700x o lan cold (2,100 gas) vi phai doc Merkle-Patricia trie tu state DB va nap vao access list, "
    "nhung lan warm sau chi con 100 gas nho cache trong tx. "
    "SSTORE dat nhat (gap ~7,000x so voi ADD, 22,100 gas khi tao moi) vi ghi storage la thay doi trang thai vinh vien — "
    "phai cap nhat trie, ghi WAL va duoc moi node luu mai mai, nen giao thuc dinh gia cao de ngan bloat state."
)


def print_table():
    print("Nguon: https://www.evm.codes  (sau EIP-2929 Berlin + EIP-3529 London)\n")
    print(f"  {'Opcode':<32}  {'Gas':>8}  {'Nhom':<22}  Ghi chu")
    print(f"  {'-'*32}  {'-'*8}  {'-'*22}  {'-'*40}")
    for r in TABLE:
        print(f"  {r['opcode']:<32}  {r['gas']:>8,}  {r['nhom']:<22}  {r['ghi_chu']}")
    print(f"\nGiai thich ti le (3 cau):\n  {EXPLANATION}\n")
    print("Luu y: SSTORE chinh xac phu thuoc Berlin/London; evm.codes hien thi chi tiet")
    print("  SSTORE (0->x) / (x->y). Neu thay 22100/5000/2900 thi do la dap an dung.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Homework 2 gas reference")
    parser.add_argument("--json", action="store_true", help="In JSON thay vi bang text")
    args = parser.parse_args()
    if args.json:
        print(json.dumps({"table": TABLE, "explanation": EXPLANATION}, indent=2, ensure_ascii=False))
    else:
        print_table()
