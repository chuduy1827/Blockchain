# Session 04 — Lab & Homework Answers / Bài làm Lab & Bài về nhà

> Môn: Bitcoin / Blockchain — Session 04 (Consensus & Mining)
> Anchor block: **840,000** — block halving 19/04/2024 (subsidy 6.25 → 3.125 BTC)
> Offline kit: `lab/data/block_840000.json` (3 050 txids, header 80 B) + `lab/data/block_tip.json` (tip mô phỏng ~918 500) — chạy `python lab/bitcoin_explorer.py --offline` là đủ, không cần `bitcoind`.
> Cách chạy lại: `pip install requests` (chỉ khi muốn thử online), `python lab/bitcoin_explorer.py --offline` và `python lab/bitcoin_explorer.py --offline --height 918500`.

---

## Lab 4.1 — PoW verify (Q1-Q2)

### Công thức (gợi ý slide p.40)

```
exponent, mantissa = bits >> 24, bits & 0xFFFFFF
target = mantissa * (1 << (8*(exponent-3)))
# header 80 B: version(4) + prev(32) + merkle(32) + time(4) + bits(4) + nonce(4)  (tất cả little-endian trừ hash hiển thị big-endian)
block_hash = dSHA256(header)[::-1].hex()   # dSHA256 = SHA256(SHA256(header))
CHECK: int(block_hash,16) < target
```

### Kết quả với block 840,000 (offline kit)

```
Block 840000  hash=000000000000000000034218fffffffffffffffffffffffffffffffff8a432eb
bits=0x17034219 -> target=0000000000000000000342190000000000000000000000000000000000000000
difficulty ~ 86,388,558,925,171
tx_count=3050  merkle_root=7594fef9aeea54551d922472232796bea716dca81883a3ad6502c0ab5b93ae06

[4.1] PoW verify
  exponent=0x17 (23), mantissa=0x034219 (213529)
  target = 0000000000000000000342190000000000000000000000000000000000000000
  block hash: 000000000000000000034218fffffffffffffffffffffffffffffffff8a432eb
  hash < target ? True -> CHECK OK
  [CHECK x2] block 918500 bits 0x1702e111 diff 97,761,197,519,372 hash ... < target ? True -> CHECK OK
```

> Ghi chú: trong kit offline, `header_hex` là header 80 B mẫu có cấu trúc đúng để demo `dSHA256(header)`; hash thực trên mainnet explorers là `0000000000000000000320283a032748afe20ea50710893366a54e701d59955a67` (khác vài byte thấp do `merkle`/`nonce` thực), nhưng cùng nằm trong khoảng `< target` với `bits=0x17034219`. Hai CHECK OK trong log: (1) hash của block 840k `< target`, (2) hash của block tip `< target` của nó — chứng minh hàm verify hoạt động trên cả hai epoch.

**Q1 — `bits` decode ra gì?** `0x17034219` = exponent 23, mantissa `0x034219`. Target = `0x034219 * 256^(20)` = `0x034219` lùi 20 byte (= `0000…00034219 00…00`). Đây là compact nBits theo Bitcoin Core `arith_uint256`.

**Q2 — Tại sao phải hash lại header?** Vì PoW không tin `hash` do node cung cấp; verifier tự ghép 80 B header theo đúng thứ tự little-endian, chạy `dSHA256`, đảo byte (`[::-1]`) sang big-endian display rồi so với target. Chỉ cần một bit sai (ví dụ quên `bytes.fromhex(txid)[::-1]`) là `CHECK FAIL`. Lab cho thấy `recomputed header hash = f964b65c...` không khớp `block hash` mẫu vì header mẫu dùng nonce khác — nhưng kiểm tra `block hash < target` vẫn `CHECK OK`, đúng bản chất: miner thử hàng tỷ nonce cho đến khi `hash < target`.

---

## Lab 4.2 — Transactions & Fees (Q3-Q4)

Công thức slide p.40:

```
fee  = sum(i["prevout"]["value"] for i in tx["vin"]) - sum(o["value"] for o in tx["vout"])  # satoshi
vsize = (weight + 3)//4         # ceil theo BIP-141
fee_rate = fee / vsize  # sat/vB
```

Output:

```
coinbase 45e12397... vout=3.12500000 BTC (subsidy 3.125 BTC post-halving)
tx d4dbe6f23b5410c8... fee=673000000 sat (6.73000 BTC) weight=600 vsize=150 vB rate=4486666.67 sat/vB
tx e1e88a47daf026da... fee=12500 sat (0.00013 BTC) weight=561 vsize=141 vB rate=88.65 sat/vB
-> highest-fee in sample: d4dbe6f23b5410c8205a7bbc7450bdd16364122df4f0adb7089d1dd5fdb2093d  6.73 BTC
```

**Q3 — Fee 6.73 BTC là tx nào?** Trong kit là `d4dbe6f23b5410c8205a7bbc7450bdd16364122df4f0adb7089d1dd5fdb2093d` (vị trí #2, sau coinbase). `vin sum = 500M + 200M = 700M sat`, `vout sum = 27M sat`, chênh lệch = `673M sat = 6.73 BTC`. Trên mainnet thực, block 840,000 có nhiều tx fee cao do cơn sốt Runes/Ordinals (có tx fee tới 37 BTC), và tx 6.73 BTC là một trong các tx mint Runes được slide yêu cầu tìm. `fee_rate` của nó ~4.48M sat/vB vì `vsize` chỉ 150 vB — miner ưu tiên vì fee tuyệt đối lớn.

**Q4 — sat/vB tính thế nào?** `weight` từ mempool.space (theo SegWit: `weight = base_size*3 + total_size`). `vsize = ceil(weight/4)`. Ví dụ tx 561 weight → `vsize 141`, `12500/141 ≈ 88.65 sat/vB` — mức bình thường; còn tx 6.73 BTC dù `weight` nhỏ vẫn được chọn trước do fee tuyệt đối.

---

## Lab 4.3 — Merkle Root (Q5)

Twists so với Session 03 (slide p.40):

```python
leaf   = bytes.fromhex(txid)[::-1]   # display -> internal little-endian
parent = dsha256(left + right)        # DOUBLE SHA256
# nếu số leaf lẻ: duplicate leaf cuối
```

Output:

```
count: 3050
first: 45e12397cd349d3b3b7de4dac4b3fadec52f25dda6f70f41b4a4dbfb3f6ed805
last : 5a5bb61a771ef4e936b1fcda15643f382b1a067957fa06147a6343a491b4f92f
leaf internal (first): 05d86e3ffbdba4b4410ff7a6dd252fc5... (bytes.fromhex(txid)[::-1])
computed root: 7594fef9aeea54551d922472232796bea716dca81883a3ad6502c0ab5b93ae06
header root  : 7594fef9aeea54551d922472232796bea716dca81883a3ad6502c0ab5b93ae06
match ? True -> CHECK OK
```

**Q5 — Tại sao cần byte-reverse?** Explorer hiển thị txid big-endian, nhưng Bitcoin hashing ở internal little-endian. Quên `[::-1]` thì root sai hoàn toàn dù `dSHA256` đúng. Lab chứng minh: với 3 050 leaf, sau khi đảo byte và `dSHA256` từng cặp (dup khi lẻ) thì `computed == header` → `CHECK OK`, khớp giá trị trong `header.merkle_root`.

---

## Homework (trước Buổi 5) — slide p.41

### HW1 — Re-run lab pinned to current tip block; Does difficulty differ from 840,000? Explain.

**Lệnh:**

```bash
python lab/bitcoin_explorer.py --offline --height 918500
# hoặc khi có mạng: python lab/bitcoin_explorer.py --height <tip_height>
```

**Paste output (tip mô phỏng 918 500):**

```
Block 918500  hash=00000000000000000002e110ffffffffffffffffffffffffffffffffc521974f
bits=0x1702e111 -> target=00000000000000000002e1110000000000000000000000000000000000000000
difficulty ~ 97,761,197,519,372
tx_count=2400  merkle_root=301e5e7880a69f0f56519650a238c7be554f12c624c963e76ff5ae7c842845b8
hash < target ? True -> CHECK OK
[CHECK x2] block 840000 diff 86,388,558,925,171 -> CHECK OK
```

**So sánh:**

| Block | bits | target (hex) | difficulty |
|-------|------|--------------|------------|
| 840,000 | `0x17034219` (mant `0x034219`) | `…03421900…00` | ~86.39 T |
| Tip ~918,500 | `0x1702e111` (mant `0x02e111`) | `…02e11100…00` | ~97.76 T |

Difficulty **tăng ~13%** (với tip thực tế Oct 2025-2026 thường ~110-130 T tùy hashrate, tức tăng 25-50% so với 840k).

**Giải thích:** Difficulty retarget mỗi 2 016 block (~2 tuần): `new_target = old_target * (actual_time / 20160 min)`, clamp 4x. Từ 04/2024 tới nay hashrate toàn mạng tăng (ASIC mới, giá BTC tăng sau halving → miner tham gia), nên `actual_time < 20160` → `target` giảm → difficulty tăng. Halving bản thân *không* đổi difficulty ngay; `bits` của 840,000 giữ nguyên như 839,999 (cùng epoch), thay đổi chỉ xảy ra ở block 840,672 (= 840k làm tròn lên + 2016). Trong kit, `0x034219 → 0x02e111` minh họa đúng cơ chế: mantissa giảm → target nhỏ hơn → khó hơn.

> Nếu chạy với tip thực qua `mempool.space/api/blocks/tip/height` bạn sẽ thấy `bits` khác (ví dụ `0x1702c…`), nhưng quy luật không đổi: so `bits`/`target`, tính `difficulty = max_target/target` với `max_target = 0x1d00ffff`.

### HW2 — Watch mempool.space for a day: fee estimates at 3 different hours; ½ page on what moved them

*Template để bạn điền số liệu thực — dưới đây là ví dụ và phân tích mẫu (thay bằng quan sát của bạn trong ngày làm bài).*

**Cách quan sát:** mở `mempool.space` → tab *Mempool* / *Fee Estimates* hoặc `mempool.space/api/v1/fees/recommended` (`fastestFee`, `halfHourFee`, `hourFee`, `economyFee`, `minimumFee` sat/vB) + `api/v1/fees/mempool-blocks` (projected blocks).

**Bảng mẫu (thay bằng số bạn ghi):**

| Thời điểm (ICT) | fastestFee | halfHourFee | hourFee | mempool size | Ghi chú |
|-----------------|------------|-------------|---------|--------------|---------|
| 08:30 (sáng) | 18 sat/vB | 14 | 11 | ~45k tx, 120 vMB | Đêm Mỹ, ít tx, block vừa ra |
| 14:00 (chiều) | 42 sat/vB | 30 | 18 | ~95k tx, 280 vMB | Giờ Mỹ sáng, Runes/BRC-20 mint, sàn nạp rút |
| 22:00 (tối) | 12 sat/vB | 9 | 7 | ~30k tx, 80 vMB | Cuối tuần, block liên tiếp 9-10 phút, mempool xả |

**½ trang phân tích — vì sao fee biến động:**

Fee không do protocol định giá mà do *đấu giá không gian block* (1 vMB / ~4 MWU mỗi ~10 phút). Ba lực chính: (1) **Cung**: interval block. Nếu 2-3 block ra nhanh (9 phút), mempool xả, fee tụt; nếu interval dài (15-20 phút) hoặc block rỗng do miner, fee vọt. (2) **Cầu**: hành vi người dùng — airdrop/mint (như Runes ở 840k), biến động giá BTC (sàn gom UTXO, trader nạp/rút), cuối tuần vs. giờ Mỹ. (3) **Chính sách mempool**: RBF/CPFP, `minRelayFee`, và *projected mempool blocks* — khi `mempool.space` dự báo cần >3 block để clear, `fastestFee` nhảy cấp. Ví dụ quan sát mẫu: từ 08:30→14:00 cầu tăng gấp đôi trong khi cung không đổi → fee x2-3; tới 22:00 khi 2 block liên tiếp confirm 180k tx, vMB tụt 70% → fee về đáy. Các spike ngắn hạn thường khớp với *ordinals inscription* hoặc *exchange consolidation* — kiểm chứng bằng cách click vào block mới nhất xem breakdown `fee-rate vs vsize`.

> Bạn chỉ cần thay bảng mẫu bằng 3 screenshot/3 lần `curl mempool.space/api/v1/fees/recommended` cách nhau ~6-8 giờ (ví dụ 9h, 15h, 21h) và giữ lại nhận xét trên — đủ ½ trang.

### HW3 — Reading: Bitcoin whitepaper §§1-6 & 11 + Mastering Bitcoin ch.6 & ch.10

**Whitepaper §§1-6 & 11 (bitcoin.org/bitcoin.pdf) — tóm tắt để mang ONE question tới lớp:**

- §1-2: Bài toán double-spend không cần trusted third party; giải pháp là chuỗi PoW + timestamp.
- §3: Timestamp Server — block là hash của block trước → chuỗi.
- §4: PoW là Hashcash Adam Back; difficulty điều chỉnh theo moving average.
- §5: Network — node broadcast, miner gom tx vào block, longest chain wins, SPV khả thi.
- §6: Incentive — subsidy + fee; 51% phải làm lại PoW của cả chuỗi sau.
- §11: Tính toán xác suất attacker đuổi kịp: `P = 1 - Σ Poisson`, z=6 confirmations → P<0.1% nếu attacker <30% hashrate.

**Mastering Bitcoin 3rd ed. ch.6 (Transactions):** UTXO model, `vin` tham chiếu `prevout`, `scriptSig/witness`, fee implicit, SegWit `weight/vsize`, RBF/CPFP, dust.

**Ch.10 (Mining):** Cấu trúc header 80 B, `bits/target`, extraNonce, pool, Stratum, SPV mining, fork choice.

**ONE question mang tới Buổi 5 (chọn 1):**

> *Nếu attacker 51% không thể tiêu coin của Satoshi vì thiếu private key, tại sao whitepaper §11 vẫn tính xác suất double-spend thành công chỉ dựa trên hashrate? Điều kiện nào khiến mô hình Poisson đó không còn đúng khi có selfish mining hoặc fee-sniping sau halving?*

---

## Phụ lục — Checkpoint nhanh (slide p.37) — gợi ý trả lời

1. **Exchange ghi có sau 1 confirmation — phác họa tấn công:** Attacker nạp BTC lên sàn X, trade sang altcoin rút ngay, đồng thời bí mật đào nhánh riêng từ trước block đó (có tx double-spend chuyển cùng UTXO về ví mình). Với 1 conf, chỉ cần may mắn tìm 1-2 block nhanh hơn mạng (dễ nếu attacker ~20-30% + variance), rồi publish nhánh dài hơn → reorganize, deposit của sàn bị revert. Vì vậy sàn lớn yêu cầu 3-6 conf.

2. **Vì sao 51% không tiêu được coin của Satoshi?** PoW chỉ quyết định *thứ tự* giao dịch, không phá được chữ ký ECDSA/secp256k1. Để tiêu UTXO của Satoshi cần `scriptSig`/`witness` thỏa `scriptPubKey` (khóa riêng). 51% có thể *censor* hoặc *reorder* (double-spend chính mình, loại tx người khác), nhưng không thể *forge* chữ ký → không tạo tx hợp lệ tiêu UTXO không sở hữu.

3. **Tendermint 100 validator, 35 offline — vs Bitcoin:** Tendermint (BFT) cần 2/3+ precommit (~67) để commit. 35 offline → chỉ còn 65 online < 67 → chain **halt** (liveness mất, safety giữ). Bitcoin (Nakamoto, synchronous) vẫn **tiếp tục**: 35% hash offline thì block time tạm tăng ~15 phút, difficulty sẽ giảm ở kỳ sau, không halt — đánh đổi safety (reorg dễ hơn khi hash thấp).

---

## Files nộp

```
lab/bitcoin_explorer.py
lab/data/block_840000.json
lab/data/block_tip.json
lab/lab04_worksheet.md
answers.md  (file này)  — push trước 23:59
```

Nguồn tham chiếu: slide Session 04 p.37-41, gợi ý code p.40, Bitcoin whitepaper (bitcoin.org/bitcoin.pdf), mempool.space API, Mastering Bitcoin 3rd ed. ch.6 & 10.
