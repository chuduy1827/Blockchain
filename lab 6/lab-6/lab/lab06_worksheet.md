# Lab 6 — ClassRegistry: Worksheet / Phiếu thực hành

## Bước 0 — Chuẩn bị

- MetaMask đã thêm mạng TrustKeys L1 testnet: RPC `https://l1testnet.trustkeys.network`, chainId `11968`
- Địa chỉ test đã được faucet nạp tiền
- Đã tạo thư mục project `lab06-classregistry` (xem cây thư mục bên dưới)

---

## Bước 1 — `npx hardhat init` (JS) + test mẫu

Trên máy của bạn:

```bash
cd lab06-classregistry
npm install
npx hardhat test
```

Kết quả mong đợi: Hardhat báo `Hardhat Toolbox v4` và chạy được sample test (nếu còn). Sau khi thay test bằng `test/ClassRegistry.test.js` của lab, kết quả là 9 tests xanh (xem Bước 2).

---

## Bước 2 — `ClassRegistry.sol` + Chai tests

### Contract `contracts/ClassRegistry.sol`

```solidity
function getAllMembers() external view returns (address[] memory addrs, string[] memory names)
```

- Pure view, không tốn gas khi `eth_call`; trả về toàn bộ `_members` + `_names` trong 1 lần gọi — thuận tiện cho frontend.
- Tuần tự logic trong contract (đúng thứ tự slide Anatomy p.7):
  1. `SPDX` + `pragma ^0.8.20`
  2. `error` custom (AlreadyRegistered, NotRegistered, EmptyName, NotOwner)
  3. `event` indexed (Registered, Deregistered)
  4. state: `owner immutable`, `mapping _names`, `address[] _members`, `mapping _indexPlusOne`
  5. `modifier onlyOwner`
  6. `constructor() { owner = msg.sender; }`
  7. `register(string calldata name)` — check EmptyName, AlreadyRegistered, push, emit
  8. `deregister(address who)` — onlyOwner, swap-and-pop giữ mảng dense
  9. reads: isRegistered, nameOf, memberCount, memberAt, **getAllMembers**

### Test `test/ClassRegistry.test.js` — 9 tests

| #   | Test                                                        | Mục tiêu slide                    |
| --- | ----------------------------------------------------------- | --------------------------------- |
| 1   | owner == deployer                                           | immutable                         |
| 2   | register + event + isRegistered/nameOf/memberCount/memberAt | mapping + array pattern           |
| 3   | EmptyName revert                                            | custom error + bytes(name).length |
| 4   | AlreadyRegistered revert                                    | \_indexPlusOne check              |
| 5   | 2 người đăng ký, kiểm tra thứ tự                            | address[]                         |
| 6   | non-owner deregister -> NotOwner                            | modifier onlyOwner                |
| 7   | owner deregister swap-and-pop + event                       | swap-and-pop                      |
| 8   | **getAllMembers** (homework extra view)                     | yêu cầu Homework #3               |
| 9   | queryFilter replay Registered                               | Interact — no explorer (p.37)     |

Chạy:

```bash
npx hardhat test
```

### Biên dịch

```bash
npx hardhat compile
```

---

## Bước 3 — Deploy lên TrustKeys + register

### Cấu hình `hardhat.config.js`

```js
trustkeys: {
  url: "https://l1testnet.trustkeys.network",
  chainId: 11968,
  accounts: [process.env.PRIVATE_KEY],
}
```

- Tạo `.env` từ `.env.example`: dán PRIVATE_KEY của **tài khoản TEST riêng** — TUYỆT ĐỐI không dùng key thật.
- `.env` đã có trong `.gitignore`, chỉ commit `.env.example`.

### Deploy

```bash
npx hardhat run scripts/deploy.js --network trustkeys
```

Output:

```
ClassRegistry deployed at: 0x...   <-- LƯU LẠI địa chỉ này
tx hash: 0x...                     <-- LƯU LẠI tx hash
owner: 0x...
```

### Register

```bash
npx hardhat console --network trustkeys
> const r = await ethers.getContractAt("ClassRegistry", "0x<addr>")
> await (await r.register("Nguyen Van A - MSSV")).wait()
```

---

## Bước 4 — Đọc lại state qua ethers / queryFilter (5', slide p.37)

TrustKeys **không có explorer công khai** -> đọc bằng ethers:

```bash
CONTRACT=0x<địa chỉ đã deploy> npx hardhat run scripts/interact.js --network trustkeys
```

hoặc trong `hardhat console --network trustkeys`:

```js
const r = await ethers.getContractAt("ClassRegistry", "0x<addr>");
await r.memberCount();
const evs = await r.queryFilter(r.filters.Registered());
evs.forEach((e) => console.log(e.args.who, e.args.name));
await r.getAllMembers();
```

Trên Remix: gọi các hàm `view` (memberCount, memberAt, getAllMembers, isRegistered, nameOf) và xem logs `Registered` trong receipt.

---

## Kết quả deploy (điền sau khi chạy)

- Deployed address: `0x________________________________________`
- Deploy tx hash: `0x________________________________________`
- Mạng: TrustKeys L1 testnet (chainId 11968)
- Tài khoản deploy: `0x________________________________________`
