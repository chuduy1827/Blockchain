# Lab 04 Worksheet — Block 840,000 (2024 Halving Block)

> Chạy: `python bitcoin_explorer.py --offline` (hoặc `python bitcoin_explorer.py` khi có mạng)
> Offline kit: `lab/data/block_840000.json` (3 050 txids) + `lab/data/block_tip.json`

## 4.1 PoW verify
- [ ] decode `bits` -> target
- [ ] re-hash 80-byte header -> CHECK OK x2

## 4.2 Tx & fees
- [ ] fee = Σin - Σout; sat/vB from weight
- [ ] tìm tx có fee 6.73 BTC

## 4.3 Merkle root
- [ ] 3,050 txids -> root == header (dSHA256 + byte-reverse)
