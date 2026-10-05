# Lab 05 — Ethereum accounts, gas & EVM — Bài làm Homework

> **Môn:** Blockchain Technology and Cryptocurrency — Session 05 (TS. Nguyễn Trung Thanh)
> **Lab:** TrustKeys L1 testnet (chainId 11968) + Sepolia — read-only với `web3.py` + MetaMask
> **Nộp:** `lab05_<ten>.md` gồm Q1–Q6 + 2 screenshot Lab 5.4 + Homework 1–2
> **Bộ code kèm theo (chạy tuần tự Lab 5.1 → 5.4 → Homework):**

| File | Dùng cho | Lệnh chạy |
|------|----------|-----------|
| `requirements.txt` | Cài deps | `pip install -r requirements.txt` |
| `fee_history.py` | Lab 5.2 — đọc chain | `python fee_history.py` |
| `fee_decompose.py` | Lab 5.3 — phân rã phí | `python fee_decompose.py --tx 0x<hash>` |
| `compare_chains.py` | Homework 1 — so sánh 2 chain | `python compare_chains.py --out snapshot1.json` |
| `evm_gas_reference.py` | Homework 2 — bảng gas | `python evm_gas_reference.py` |

> **Trình tự bắt buộc:** Lab 5.1 (MetaMask) → Lab 5.2 (`fee_history.py` → trả lời Q2/Q3) → Lab 5.3 (gửi tx type-2 rồi `fee_decompose.py` → trả lời Q4/Q5) → Lab 5.4 (Etherscan → trả lời Q6) → Homework 1+2.
> **Lưu ý môi trường trợ lý:** VM bị chặn outbound HTTP nên không gọi RPC trực tiếp. Toàn bộ số liệu dưới đây lấy từ *Reference output* trong worksheet (block 717152, 2026-08-14) và diễn giải đúng theo EIP-1559 / Yellow Paper / evm.codes. Khi bạn chạy lại trên máy, thay số bằng output thực tế — kết luận định tính không đổi.

---

## 0. Chuẩn bị — cài đặt

```bash
python3 --version        # >= 3.8
pip install -r requirements.txt   # web3 v6/v7
# Hoặc: pip install web3
```

**Lab 5.1 — Thêm TrustKeys L1 vào MetaMask (10'):**

MetaMask → chọn mạng → Add a network manually:

- Network name: `TrustKeys L1 testnet`
- RPC URL: `https://l1testnet.trustkeys.network`
- Chain ID: `11968` (0x2ec0)
- Currency symbol: theo giảng viên xác nhận trên lớp
- Block explorer: để trống

> Ví của bạn được sinh từ BIP39 mnemonic (Session 1/3, BIP44 `m/44'/60'/0'/0/0`) nên địa chỉ trên TrustKeys L1 trùng với ví `app.dem.chat`.

---

## Lab 5.1 — Q1: Vì sao chainId nằm trong mọi giao dịch đã ký (EIP-155)?

**Câu hỏi:** Adding a network only changes the RPC endpoint + chainId — your private key never leaves the device. Why is chainId also part of every signed transaction (EIP-155, Session 3)?

**Trả lời (sau khi làm Lab 5.1):**

Trước EIP-155, chữ ký chỉ bao phủ `{nonce, gasPrice, gasLimit, to, value, data}` nên cùng một `r,s,v` có thể được *replay* nguyên văn sang chain khác dùng chung định dạng (ví dụ: Ethereum mainnet → ETC, hoặc mainnet → testnet/private chain) nếu địa chỉ gửi có cùng nonce và số dư. Kẻ tấn công chỉ cần copy raw transaction.

EIP-155 sửa bằng cách đưa `chainId` vào phần dữ liệu được ký: `v = chainId*2 + 35/36`, và `chainId` được hash cùng payload trước khi ký. Node sẽ từ chối giao dịch nếu `chainId` trong chữ ký không khớp `chainId` của chain đang chạy. Do đó đổi RPC trong MetaMask không làm lộ private key, nhưng mỗi chain có miền chữ ký riêng — không thể replay cross-chain.

> Liên hệ Session 3: `ecrecover(v,r,s)` khôi phục public key, nhưng `v` đã ràng buộc chainId nên chữ ký chỉ hợp lệ trên đúng một chain.

---

## Lab 5.2 — Đọc chain bằng web3.py → rồi trả lời Q2/Q3

### Bước 1: Chạy code

```bash
# TrustKeys L1 (mặc định)
python fee_history.py
# Hoặc chỉ định RPC/label/địa chỉ:
python fee_history.py --rpc https://l1testnet.trustkeys.network --label "TrustKeys L1"
MY_ADDRESS=0x... python fee_history.py   # kiểm tra balance của chính bạn
```

**Code làm gì (tuần tự):** `fee_history.py` kết nối read-only → `eth_getBlockByNumber latest` (baseFee, gasLimit/Used) → `eth_getBalance` → `eth_feeHistory 20 blocks` in 20 dòng + verdict `BUSY/quiet`.

> `ExtraDataToPOAMiddleware` là **bắt buộc** vì TrustKeys L1 là chain PoA (clique) — `extraData` dài 97 byte thay vì 32 byte; thiếu sẽ gặp `ExtraDataLengthError`. Sepolia/BSC cũng cần middleware này.

### Bước 2: Kết quả (sau khi chạy)

**Reference output từ worksheet (block 717152, 2026-08-14) — bạn sẽ thấy số khác nhưng pattern giống hệt:**

```
Connected to TrustKeys L1  chainId=11968  head block=717152
[eth_getBlockByNumber latest]
  number        = 717152
  gasLimit      = 30,000,000
  gasUsed       = 173,386 (0.58% full)
  baseFeePerGas = 8 wei = 0.000000008 gwei  <- EIP-1559 active
  #txs          = 1
  extraData len = 97 bytes

[eth_getBalance]
  address = 0x5A351A9280e2e5b9324408EC5769D0745d7aB512
  balance = 1935177932000000000 wei = 1.935177932 coin

[eth_feeHistory] last 20 blocks (base fee series)
     block    baseFee(gwei)  gasUsedRatio    tip p50(gwei)
    717133       0.000000008        7.96%          2.0000
    ...
    717152       0.000000008        0.58%          2.0000
  next block's projected baseFee = 8 wei = 0.000000008 gwei
  (baseFeePerGas len=21 = N+1, gasUsedRatio len=20 = N)
  average gasUsedRatio over window = 1.89% -> chain is quiet

  CHECK baseFee len N+1 & ratio len N: OK
  CHECK printed 20 lines: OK
```

> Khi bạn chạy lại, dán toàn bộ output trên vào phụ lục — TA kiểm tra `CHECK = OK`.

### Q2: Vì sao base fee đứng im ở floor (vài wei) khi gasUsedRatio ~2%?

**Trả lời (dựa trên output Lab 5.2 vừa chạy):**

Công thức EIP-1559: `nextBaseFee = baseFee * (1 + 0.125 * (gasUsed - target)/target)`, với `target = 15M gas, cap = 30M`.

* Đúng target (15M) → giữ nguyên; vượt target → tăng tối đa +12.5%/block; dưới target → giảm tối đa −12.5%/block.

Trên TrustKeys L1, `avg gasUsedRatio ≈ 1.89%` ⇒ `gasUsed ≈ 0.28M`, chỉ ~2% target. Mỗi block trống làm base fee giảm 12.5%, nhưng EIP-1559 có *floor* (1 wei, thực tế quan sát ~7–8 wei do làm tròn). Sau vài block trống liên tiếp, base fee đã rơi xuống floor và không thể giảm thêm — "dính đáy". Chỉ khi nhu cầu vượt 15M/block trong nhiều block liên tiếp, base fee mới leo thang theo hàm mũ (+12.5%/block) cho tới khi cầu giảm.

> So sánh: mainnet giờ cao điểm block liên tục >15M nên base fee tăng cấp số nhân cho tới khi người dùng giảm tip hoặc rời đi.

### Q3: `eth_feeHistory` trả `baseFeePerGas` dài N+1 nhưng `gasUsedRatio` dài N — phần tử dư là gì, wallet dùng nó thế nào?

**Trả lời (dựa trên output Lab 5.2):**

* `baseFeePerGas` có `N+1` phần tử: `N` base fee của `N` block trong cửa sổ + **1 phần tử cuối = base fee dự kiến của block kế tiếp** (`nextBaseFee`), tính sẵn từ block `latest`.
* `gasUsedRatio` chỉ có `N` phần tử vì nó mô tả mức độ đầy của từng block *đã* có; block tương lai chưa có `gasUsed`.

**Wallet dùng thế nào:** để đặt `maxFeePerGas`, wallet lấy `nextBaseFee` (phần tử N+1) làm floor, cộng biên an toàn (ví dụ `nextBaseFee * 1.2` hoặc `+ 2–5 gwei`) và cộng `maxPriorityFeePerGas`. Nếu không dùng phần tử dư, wallet sẽ đặt fee dựa trên base fee *cũ* và dễ bị underprice khi base fee vừa tăng.

```python
next_base = fh["baseFeePerGas"][-1]          # phần tử dư
maxPriority = w3.to_wei(2, "gwei")
maxFee = next_base + maxPriority + w3.to_wei(0.5, "gwei")  # buffer
```

---

## Lab 5.3 — Gửi giao dịch type-2 và phân rã phí → rồi trả lời Q4/Q5

### Bước 1: Gửi tx thật bằng MetaMask

1. MetaMask → TrustKeys L1 → Send **0.001 coin** cho bạn cùng lớp (hoặc chính mình).
2. Xác nhận đây là **type-2 (EIP-1559)** — MetaMask hiện *Max base fee* + *Priority fee* thay vì một `gasPrice` duy nhất.
3. Copy **transaction hash** `0x...` (66 ký tự).

### Bước 2: Chạy code phân rã

```bash
python fee_decompose.py --tx 0x<hash-cua-ban>
# Hoặc: export TX_HASH=0x... && python fee_decompose.py
```

**Code làm gì:** `eth_getTransactionReceipt` + `eth_getTransaction` + `eth_getBlock` → tính `paid = gasUsed*effectiveGasPrice`, `burned = gasUsed*baseFee`, `tip = gasUsed*(effectiveGasPrice - baseFee)` → kiểm tra `paid == burned + tip`.

### Bước 3: Kết quả (sau khi chạy)

**Reference (transfer 21,000 gas, worksheet):**

```
[receipt]  blockNumber=717153  status=1  gasUsed=21000
[tx]       type=2  maxFeePerGas=...  maxPriorityFeePerGas=...
[block]    baseFeePerGas=8

[fee decomposition]  gasUsed=21,000
  baseFee           = 8 wei = 0.000000008 gwei
  effectiveGasPrice = 1.000000008 gwei = 1_000_000_008 wei

  paid   = 21_000_000_168_000 wei = 0.000021000000168 coin
  burned = 168_000 wei            (leaves circulation)
  tip    = 21_000_000_000_000 wei  (to proposer)

  invariant: paid == burned + tip ? True
  -> CHECK OK: đem dòng này cho TA.
```

Trên TrustKeys L1 base fee chỉ vài wei nên **gần như toàn bộ phí là tip**; trên mainnet lúc nghẽn, phần `burned` chiếm đa số. **CHECK/demo:** cho TA xem `paid == burned + tip` với hash thật của bạn.

### Q4: Nếu tăng Max base fee trong MetaMask nhưng giữ nguyên priority fee, effectiveGasPrice có đổi không?

**Trả lời (dựa trên output Lab 5.3):**

```
effectiveGasPrice = baseFee + min(maxPriorityFeePerGas, maxFeePerGas - baseFee)
```

* Nếu `maxPriorityFee < maxFee - baseFee` thì `min(...)` = `maxPriorityFee` và `effectiveGasPrice = baseFee + maxPriorityFee`. Tăng `maxFee` lúc này **không đổi** gì — tip bị kẹp bởi `maxPriorityFee`.
* Chỉ khi `maxPriorityFee > maxFee - baseFee` (maxFee quá thấp, chính nó là nút thắt) thì tăng `maxFee` mới kéo `effectiveGasPrice` lên.

Trên TrustKeys L1, `baseFee ~8 wei` rất nhỏ so với `maxFee` (thường vài gwei) nên trường hợp thứ hai hiếm — tăng `maxFee` đơn thuần thường **không đổi** `effectiveGasPrice`.

### Q5: Vì sao transfer tốn đúng 21,000 gas và vì sao giao dịch thất bại vẫn mất gas?

* **21,000 gas** là chi phí *intrinsic* tối thiểu trong Yellow Paper: `G_transaction = 21,000` bao gồm chữ ký, nonce check, chuyển value. Đây là mức sàn trước khi tính thêm gas cho `data` (16 gas/byte non-zero, 4 gas/byte zero), tạo contract hay thực thi EVM. Transfer thuần `to=EOA, data=0x` không có bước nào thêm nên đúng 21,000.
* **Thất bại vẫn mất gas** vì EVM đã tiêu tài nguyên để *thử* thực thi: tx vẫn được đưa vào block, chữ ký vẫn xác thực, các opcode trước `REVERT`/out-of-gas đều tốn gas. Gas là phí cho *công đã thực hiện*, không phải cho *kết quả*. Nếu không thu, kẻ tấn công có thể spam tx lỗi miễn phí để DoS mạng.

---

## Lab 5.4 — Trace contract trên Sepolia Etherscan → rồi trả lời Q6

> TrustKeys L1 chưa có explorer nên mượn Sepolia.

**Các bước:**

1. Mở https://sepolia.etherscan.io → tìm một token (ví dụ: Sepolia USDC) → mở một tx gần nhất có *Function: Transfer* (không phải plain ETH transfer).
2. Trên trang tx, bấm **Click to see More** → **Input Data** → **Decode Input Data** → ghi lại **4-byte selector** và các argument đã decode.
3. Mở tab **Logs** → đọc một event (ví dụ: `Transfer(address,address,uint256)`).

**Deliverable — 2 screenshot phải tự chụp và dán vào file nộp:**

* (a) **Decoded Input Data** — thấy rõ `Function: transfer(address,uint256)`, `MethodID: 0xa9059cbb`, và các tham số `to`, `value`.
* (b) **Logs tab** — thấy ít nhất một log với `Address`, `Name: Transfer`, `Topics` và `Data`.

> ⚠️ 2 ảnh này bạn phải tự chụp trên Sepolia Etherscan — không thể tạo giả.

### Q6: Selector `0xa9059cbb` = `keccak256("transfer(address,uint256)")[:4]` — EVM dùng 4 byte này thế nào, vì sao Etherscan cần ABI?

**Trả lời (sau khi làm Lab 5.4):**

EVM không lưu tên hàm — khi biên dịch, Solidity tạo một *dispatcher* ở đầu bytecode so sánh 4 byte đầu của `calldata` (`msg.sig`) với bảng selector hằng số và `JUMPI` tới nhánh hàm tương ứng; nếu không khớp selector nào, fallback/revert được gọi. Vì 4 byte này không tự mô tả kiểu tham số hay độ dài, Etherscan chỉ có thể giải mã phần còn lại của `calldata` thành `(address, uint256)` khi có **ABI** — JSON mô tả chữ ký, kiểu và thứ tự tham số — nếu không, nó chỉ hiển thị hex thô.

---

## Homework (trước Session 6)

### Homework 1 — So sánh base-fee series TrustKeys L1 vs Sepolia ở 2 thời điểm

**Bước 1: Chạy code ở 2 thời điểm cách nhau vài giờ**

```bash
# Lần 1 (ví dụ 09:00) — snapshot cả 2 chain:
python compare_chains.py --out snapshot1.json

# Lần 2 (ví dụ 20:00) — snapshot mới + so sánh với lần 1:
python compare_chains.py --out snapshot2.json --compare snapshot1.json

# Chỉ chạy 1 lần không lưu:
python compare_chains.py
```

**Code làm gì:** `compare_chains.py` gọi `fee_history(20)` trên cả TrustKeys L1 và Sepolia (kèm fallback `rpc.sepolia.org` nếu publicnode rate-limit), in 20 dòng baseFee + verdict, lưu JSON để so sánh.

**Bước 2: Điền kết quả thực tế vào bảng (mẫu từ reference — bạn thay bằng số của mình):**

| Thời điểm | Chain | next baseFee | avg gasUsedRatio | Nhận xét |
|-----------|-------|-------------|-----------------|----------|
| T1 (09:00) | TrustKeys L1 | ~8 wei (0.000000008 gwei) | ~1–3% | quiet, base fee ở floor |
| T1 | Sepolia | ~1–20 gwei (biến động) | ~30–60% | sôi động, có lúc > target |
| T2 (20:00) | TrustKeys L1 | ~8 wei | ~1–3% | vẫn quiet |
| T2 | Sepolia | ~1–30 gwei | ~20–70% | dao động theo cầu/faucet |

**Bước 3: Viết đoạn giải thích nửa trang (dán vào file nộp):**

TrustKeys L1 là testnet lớp học với rất ít giao dịch — mỗi block chỉ vài tx, `gasUsed` luôn << `target` 15M nên base fee bị đẩy xuống floor (vài wei) và đứng yên theo lý do Q2. Sepolia là testnet công cộng của Ethereum, được hàng nghìn dApp, faucet, bridge và bot dùng chung nên `gasUsedRatio` thường dao động quanh hoặc vượt target, khiến base fee biến thiên theo cơ chế EIP-1559 (±12.5%/block) và có thể lên tới vài chục gwei khi có đợt mint/faucet. Nói cách khác, TrustKeys L1 phản ánh *cung vượt cầu* ổn định, còn Sepolia phản ánh *cầu thực* và có tính chu kỳ theo giờ.

> Nếu Sepolia RPC bị rate-limit, thử `https://rpc.sepolia.org` hoặc Infura/Alchemy Sepolia.

---

### Homework 2 — Gas cost trên evm.codes: ADD, SLOAD (cold vs warm), SSTORE

**Bước 1: Chạy code**

```bash
python evm_gas_reference.py
# Hoặc in JSON để dán vào md:
python evm_gas_reference.py --json
```

**Bước 2: Đối chiếu trên https://www.evm.codes (sau EIP-2929 Berlin + EIP-3529 London):**

| Opcode | Gas | Nhóm | Ghi chú |
|--------|-----|------|---------|
| `ADD` | **3 gas** | veryLow | Chỉ thao tác stack, không chạm state. |
| `SLOAD` cold | **2,100 gas** | cold access (EIP-2929) | Lần đầu đọc slot trong tx. |
| `SLOAD` warm | **100 gas** | warm access | Đã đọc/ghi slot đó trong tx — cache. |
| `SSTORE` 0→0 / no-op (warm) | **100 gas** | warm no-op | Ghi lại giá trị cũ — rẻ nhất. |
| `SSTORE` 0→non-zero (tạo mới) | **22,100 gas** (20,000+2,100 cold) | cấp phát mới | Đắt nhất. |
| `SSTORE` non-zero→non-zero (sửa) | **2,900 warm** / **5,000 cold** | sửa giá trị | Tùy warm/cold. |

> Số SSTORE chính xác phụ thuộc Berlin/London; evm.codes hiển thị `SSTORE (0→x)`, `SSTORE (x→y)`. Nếu thấy `22100/5000/2900` thì đúng.

**Bước 3: Giải thích tỉ lệ trong 3 câu (dán vào file nộp):**

`ADD` rẻ nhất (3 gas) vì chỉ cộng hai số trên stack, không chạm đĩa hay trie. `SLOAD` đắt hơn ~700× ở lần cold (2,100 gas) vì phải đọc Merkle-Patricia trie từ state DB và nạp vào access list, nhưng lần warm sau chỉ còn 100 gas nhờ cache trong tx. `SSTORE` đắt nhất (gấp ~7,000× so với `ADD`, 22,100 gas khi tạo mới) vì ghi storage là thay đổi trạng thái vĩnh viễn — phải cập nhật trie, ghi WAL và được mọi node lưu mãi mãi, nên giao thức định giá cao để ngăn bloat state.

---

## Phụ lục — Checklist nộp bài

- [ ] `lab05_<ten>.md` (file này, đã điền số thực tế sau khi chạy code).
- [ ] Lab 5.2: 20 dòng base fee + verdict — `CHECK = OK` (từ `fee_history.py`).
- [ ] Lab 5.3: demo `paid == burned + tip` với hash thật cho TA (từ `fee_decompose.py`).
- [ ] Lab 5.4: 2 screenshot — (a) Decoded Input Data + selector, (b) Logs tab.
- [ ] Homework 1: 2 snapshot TrustKeys vs Sepolia + đoạn nửa trang (từ `compare_chains.py`).
- [ ] Homework 2: bảng gas + 3 câu giải thích (từ `evm_gas_reference.py` + evm.codes).
- [ ] Đã đăng ký nhóm seminar (3–4 người) + 3 nguyện vọng đề tài trước cuối tuần.

---

## Tài liệu tham khảo (từ slide)

* ethereum.org — accounts, gas, EVM, PoS: https://ethereum.org/developers
* EIPs 1559, 4844, 7702, 7251: https://eips.ethereum.org
* Yellow Paper: https://ethereum.github.io/yellowpaper/paper.pdf
* Mastering Ethereum ch.13: https://github.com/ethereumbook/ethereumbook
* EVM opcodes: https://www.evm.codes
* Flashbots / MEV: https://docs.flashbots.net
* Beacon chain explorer: https://beaconcha.in
