import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  Terminal,
  HelpCircle,
  MessageSquare,
  Cpu,
  ShieldAlert,
  Coins,
  FileCode,
  Layers,
  Award,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Send,
  Sparkles,
  ChevronRight,
  Info,
  Flame,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  Key,
  Database
} from 'lucide-react';

const callGeminiTutor = async (userPrompt, currentTopic) => {
  const apiKey = ""; // Canvas auto-injects runtime API key when empty
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const systemPrompt = `Bạn là Trợ giảng và Chuyên gia Blockchain cao cấp trong khóa học "Blockchain Technology and Cryptocurrency" (Giáo trình của TS. Nguyễn Trung Thành). 
Kiến thức bao quát:
- Session 1-3: Hash functions (SHA-256 avalanche effect, 5 ứng dụng), Merkle tree O(log n), ECDSA secp256k1 & ecrecover, BIP-39 mnemonic, BIP-32 HD trees (xprv, xpub).
- Session 4: Bitcoin chuyên sâu, UTXO model, Bitcoin Script (stack machine, cố tình KHÔNG Turing-complete để tránh halting problem/DoS), Thị trường phí (sat/vB, mempool, RBF), Đồng thuận Nakamoto (chuỗi nặng nhất, 51% attack, finality xác suất), BFT/PBFT (n >= 3f + 1, 2/3 đồng thuận).
- Session 5: EVM architecture (256-bit stack, word size khớp Keccak-256), Account model (EOA vs Contract), EIP-1559 (baseFee burn, priority tip), Proof of Stake & MEV.
- Session 6-7: Token standards (ERC-20 approve/transferFrom frontrunning rủi ro, ERC-721 on-chain SVG metadata ko cần IPFS, ERC-1155 đa token, EIP-2612 permit chữ ký off-chain), Proxy upgradeable (OpenZeppelin UUPS/Transparent, constructor vs initialize(), Storage collision).
- Session 8: Smart contract security, Reentrancy attack & Checks-Effects-Interactions (CEI), ReentrancyGuard, Static analysis (Slither), Fuzzing (Echidna), Formal verification (Certora), tại sao "audited != safe".

Phong cách trả lời: 
- Tiếng Việt học thuật nhưng mạch lạc, cực kỳ dễ hiểu, dùng ẩn dụ đời sống gần gũi (tiền lẻ UTXO, sổ kế toán, chìa khóa két...).
- Trích dẫn trực quan code (Solidity / Python / Script) khi cần.
- Động viên, truyền cảm hứng và đi thẳng vào trọng tâm câu hỏi của sinh viên.`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `[Chủ đề sinh viên đang học: ${currentTopic || 'Tổng quan Blockchain'}]\nCâu hỏi của sinh viên: ${userPrompt}`
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    }
  };

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, hiện tại hệ thống AI Tutor đang bận. Bạn hãy thử lại sau ít giây nhé!";
  } catch (err) {
    return "Đã xảy ra lỗi khi kết nối với AI Tutor. Vui lòng kiểm tra kết nối mạng!";
  }
};

const MODULES = [
  {
    id: 's1-s3',
    title: 'Module 1: Mật mã học & Cấu trúc nền tảng',
    subtitle: 'Session 1-3: Cryptographic Primitives, Merkle Trees & Ví HD',
    icon: Key,
    summary: 'Nền móng toán học của toàn bộ thế giới Blockchain: từ Hàm băm, Cây Merkle đến Chữ ký số ECDSA và Chuẩn ví HD.',
    sections: [
      {
        heading: '1. Hàm băm mật mã & Hiệu ứng thác đổ (Avalanche Effect)',
        content: `Hàm băm biến đầu vào có độ dài bất kỳ thành chuỗi bit cố định (SHA-256 luôn ra 256 bits / 32 bytes). Ba tính chất sống còn:
1. **Kháng tiền ảnh (Preimage Resistance):** Cho $y = H(x)$, bất khả thi để tìm ngược lại $x$. Ứng dụng trong PoW puzzle và tạo địa chỉ ví từ Public Key.
2. **Kháng tiền ảnh thứ hai (Second-preimage Resistance):** Cho trước $x$, không thể tìm được $x' \\neq x$ sao cho $H(x) = H(x')$. Ứng dụng trong liên kết chuỗi khối (Block linking).
3. **Kháng va chạm (Collision Resistance):** Không thể tìm bất kỳ cặp $(x, x')$ nào sao cho $H(x) = H(x')$. Ứng dụng định danh giao dịch (TxID).

*Hiệu ứng thác đổ:* Chỉ thay đổi dù 1 bit ở đầu vào, hơn 50% số bit ở đầu ra sẽ đảo lộn ngẫu nhiên hoàn toàn.`,
        codeExample: `# Thử nghiệm Avalanche effect với hashlib trong Python:
import hashlib

def sha256(msg: str) -> str:
    return hashlib.sha256(msg.encode()).hexdigest()

print(sha256("Blockchain101")) # d3c1...
print(sha256("Blockchain102")) # Hoàn toàn thay đổi dù chỉ đổi 1 ký tự!`
      },
      {
        heading: '2. Cây Merkle & Bằng chứng O(log n)',
        content: `Cây Merkle gom hàng nghìn giao dịch thành một Root 32-byte duy nhất trong Block Header.
- **Tại sao cần Merkle Tree?** Khi một ví nhẹ (SPV) muốn kiểm tra xem giao dịch của mình có nằm trong block 2,000 giao dịch hay không, nó không cần tải toàn bộ 2,000 tx. Nó chỉ cần khoảng $\\log_2(2048) = 11$ giá trị băm (Merkle Proof)!
- **Nơi Merkle sinh sống:** SPV Light clients, Merkle-Patricia Trie trong Ethereum, Whitelist airdrop thông minh với \`MerkleProof.verify()\`, và Bằng chứng dự trữ (Proof-of-Reserves) của các sàn giao dịch CEX.`,
        codeExample: `// OpenZeppelin MerkleProof verify ví dụ trên Solidity:
function isWhitelisted(bytes32[] calldata proof, bytes32 leaf) public view returns (bool) {
    return MerkleProof.verify(proof, merkleRoot, leaf);
}`
      },
      {
        heading: '3. Chữ ký số ECDSA & Cây ví phân cấp (BIP-32 / BIP-39)',
        content: `* **ECDSA secp256k1:** Ký bằng Private Key $d$, xác minh bằng Public Key $Q = d \\times G$. Đặc biệt trong Ethereum hàm \`ecrecover(hash, v, r, s)\` có thể suy ngược ra ngay địa chỉ người ký mà không cần gửi kèm Public key trong transaction!
* **Ngộ nhận chết người:** "12 từ khôi phục (seed phrase) nằm trên server ví" -> **SAI!** 12 từ sinh từ entropy nội bộ trên máy bạn. Từ 1 cụm Seed duy nhất, chuẩn **BIP-32** sinh cây khoá vô tận (\`m/44'/60'/0'/0/0\` cho Ethereum MetaMask), giúp 1 bản backup quản lý hàng triệu địa chỉ ví độc lập.`
      }
    ]
  },
  {
    id: 's4',
    title: 'Module 2: Bitcoin chuyên sâu & Đồng thuận',
    subtitle: 'Session 4: UTXO, Bitcoin Script, Phí sat/vB & Nakamoto Consensus',
    icon: Coins,
    summary: 'Mô hình tiền xu UTXO, cơ chế bảo vệ máy tính ngăn xếp Script, cơ chế phí mempool và bài toán đồng thuận chuỗi dài nhất.',
    sections: [
      {
        heading: '1. Mô hình UTXO (Unspent Transaction Output) vs Account Model',
        content: `Bitcoin KHÔNG có khái niệm "Số dư tài khoản" trong cơ sở dữ liệu!
- **Tờ tiền mặt:** Hãy tưởng tượng UTXO như các tờ tiền polymer lẻ trong ví. Bạn có 1 tờ 500k (0.8 BTC), bạn muốn trả tiền ăn trưa 200k (0.5 BTC) cho Bob:
  * Bạn phải nạp nguyên tờ 500k vào giao dịch (Input).
  * Bạn tạo Output 1: 200k (0.5 BTC) gửi Bob.
  * Bạn tạo Output 2: 299k (0.2999 BTC) gửi tiền thối (Change) về lại địa chỉ mới của chính mình!
  * Phần còn lại: $500k - 200k - 299k = 1k$ (0.0001 BTC) chính là **Phí thợ đào (Fee = ΣInput - ΣOutput)**.
⚠️ **Cảnh báo:** Phí thợ đào là phần dư NGẦM ĐỊNH (implicit). Nếu quên viết output tiền thối, thợ đào sẽ húp trọn toàn bộ số tiền thừa đó!`,
        codeExample: `// Cấu trúc 1 Transaction chuẩn của Bitcoin:
Tx = {
  version: 2,
  inputs: [ { txid: "a1b2...", vout: 0, scriptSig: "..." } ],
  outputs: [
    { value: 50000000, scriptPubKey: "OP_DUP OP_HASH160 <BobPKH>..." }, // 0.5 BTC
    { value: 29990000, scriptPubKey: "OP_DUP OP_HASH160 <AlicePKH>..." } // Tiền thối 0.2999 BTC
  ],
  locktime: 0
}`
      },
      {
        heading: '2. Ngôn ngữ Bitcoin Script: Cố ý "Không Turing-đầy đủ"',
        content: `Bitcoin sử dụng máy ngăn xếp (Stack machine) đơn giản chỉ duyệt từ trái qua phải.
- **Tại sao Satoshi cố tình không cho phép vòng lặp (No Loops / Not Turing-Complete)?**
  * Không có vòng lặp -> Code luôn luôn dừng (Always Halts) -> Tránh triệt để bài toán Halting Problem, không sợ hacker tạo vòng lặp vô tận làm đơ toàn mạng, không cần cơ chế đo phí phức tạp.
  * Không có trạng thái (No state) -> Mọi node thẩm định độc lập ra kết quả y hệt nhau.
  * Bề mặt tấn công cực nhỏ (Tiny attack surface).`
      },
      {
        heading: '3. Thị trường phí (Fee Market: sat/vB) & Đồng thuận Nakamoto',
        content: `* **Phí sat/vB (Satoshi per virtual Byte):** Thợ đào chọn giao dịch vào block dựa theo tỷ lệ phí trên dung lượng (\`sat/vB\`), không quan tâm giao dịch chuyển $1 hay 1 triệu $. Giao dịch 2-input-2-output tốn phí hơn 1-input-1-output vì chiếm nhiều byte hơn trong block!
* **Giao dịch bị kẹt phí thấp?** 2 cách giải cứu: **RBF (Replace-by-Fee)** hoặc **CPFP (Child-Pays-For-Parent)**.
* **Đồng thuận Nakamoto vs PBFT:**
  * Nakamoto: Chuỗi nặng nhất (Heaviest chain - tích lũy nhiều PoW nhất), mạng mở (permissionless), tính chắc chắn theo xác suất (Probabilistic finality - cần chờ 6 confirmations). Tấn công 51% chỉ có thể đảo ngược giao dịch quá khứ (Double-spend), **KHÔNG THỂ tiêu coin của Satoshi** vì không có Private Key!
  * PBFT / Tendermint: $n \\ge 3f + 1$, cần biết trước danh sách validator, chốt khối là chắc chắn ngay (Instant finality), nhưng trao đổi tin nhắn bậc $O(n^2)$ nên chỉ chạy được vài trăm validator.`
      }
    ]
  },
  {
    id: 's5',
    title: 'Module 3: Ethereum & Máy ảo EVM',
    subtitle: 'Session 5: EVM Stack 256-bit, EIP-1559, PoS & MEV',
    icon: Cpu,
    summary: 'Bước chuyển mình từ máy tính cộng trừ sang cỗ máy Turing-complete toàn cầu. Khám phá cách tính Gas, đốt phí BaseFee và cơ chế PoS.',
    sections: [
      {
        heading: '1. Kiến trúc Máy ảo EVM (Ethereum Virtual Machine)',
        content: `EVM là máy ngăn xếp 256-bit (256-bit stack machine). Con số 256-bit khớp hoàn hảo với hàm băm Keccak-256 và thuật toán đường cong elliptic secp256k1.
- **Môi trường Sandboxed:** EVM cách ly hoàn toàn, không có quyền đọc ổ đĩa máy tính, không có kết nối internet ngoại vi, không có hàm tạo số ngẫu nhiên thực, không có đồng hồ hệ thống. Mọi thứ vận hành thuần túy dựa trên trạng thái chuỗi (World State lưu bằng Merkle-Patricia Trie).
- **EOA vs Contract Account:** EOA (Externally Owned Account) do người dùng cầm Private Key kiểm soát, không chứa code. Contract Account chứa bytecode và storage riêng.`
      },
      {
        heading: '2. Tại sao phải đo Gas & Cơ chế EIP-1559',
        content: `Vì Ethereum là Turing-complete (cho phép chạy vòng lặp \`for\`, \`while\`), để ngăn vòng lặp vô tận làm nghẽn node, mỗi opcode đều phải trả một lượng **Gas** nhất định. Hết gas -> Giao dịch tự động Revert nhưng phí không được hoàn trả!
- **Công thức tính phí EIP-1559:**
  $$\\text{Tổng phí} = \\text{GasUsed} \\times (\\text{BaseFee} + \\text{PriorityFee})$$
  * **BaseFee (Phí cơ sở):** Được mạng tự động tính toán dựa trên độ đầy của block trước. Toàn bộ lượng ETH của BaseFee sẽ bị **ĐỐT CHÁY (Burned)** vĩnh viễn khỏi lưu thông!
  * **PriorityFee (Tip):** Khoản tiền bo trực tiếp gửi cho validator để được ưu tiên gom vào block sớm.`
      },
      {
        heading: '3. Proof of Stake (PoS) & Khái niệm MEV',
        content: `Ethereum chuyển sang PoS: Thời gian chia thành các **Slot (12 giây)** và **Epoch (32 slots = 6.4 phút)**. Validator ký cược 32 ETH, vi phạm double-vote sẽ bị **Slashing** (tịch thu coin).
- **MEV (Maximal Extractable Value):** Lợi nhuận tối đa mà thợ đào/validator (hoặc các searcher bot) có thể kiếm được bằng cách tự ý chèn, sắp xếp lại hoặc loại bỏ thứ tự giao dịch trong block (ví dụ: Arbitrage, Frontrunning, Sandwich attack trên Uniswap).`
      }
    ]
  },
  {
    id: 's6-s7',
    title: 'Module 4: Chuẩn Token & Kỹ thuật Proxy Upgrade',
    subtitle: 'Session 6-7: ERC-20, On-chain ERC-721, Permit & Storage Collision',
    icon: Layers,
    summary: 'Làm chủ các tiêu chuẩn tài sản số và kiến trúc hợp đồng nâng cấp được thông qua Proxy patterns.',
    sections: [
      {
        heading: '1. Chuẩn Token: ERC-20, On-chain NFT ERC-721 & ERC-1155',
        content: `* **ERC-20 Bản chất:** Chỉ là một Smart Contract lưu một mapping \`mapping(address => uint256) balances\` chứ không phải đồng coin riêng biệt!
  * **Quy trình 2 bước rủi ro:** \`approve(spender, amount)\` rồi sàn DEX gọi \`transferFrom(owner, recipient, amount)\`. Rủi ro: Hacker có thể frontrun đổi allowance nếu user tăng/giảm hạn mức.
* **EIP-2612 Permit:** Giải pháp ký gasless bằng chữ ký mật mã off-chain (EIP-712) rồi relayer gửi hộ, không cần tốn 2 giao dịch riêng biệt.
* **ERC-721 On-Chain Metadata:** Thay vì trỏ link ảnh về IPFS hay server AWS (có thể bị die link), dữ liệu SVG và JSON được encode base64 trực tiếp on-chain trong hàm \`tokenURI()\`.`
      },
      {
        heading: '2. Nâng cấp Smart Contract: Proxy & Bẫy Storage Collision',
        content: `Smart contract trên Blockchain là bất biến (Immutable). Để nâng cấp, ta dùng mô hình **Proxy Pattern (ERC-1967)**:
- **Proxy Contract:** Giữ toàn bộ Storage và số dư tiền ETH/Tokens. Mọi cuộc gọi được chuyển tiếp qua \`delegatecall\` sang Implementation Contract.
- **Logic Contract (Implementation):** Chứa code nghiệp vụ thuần túy.
⚠️️ **2 Bẫy chí mạng khi viết Proxy:**
1. **Không dùng constructor:** Hợp đồng nâng cấp phải dùng hàm \`initialize()\` kết hợp biến bool bảo vệ, vì constructor chỉ chạy trên ngữ cảnh của Logic contract chứ không chạy trên Storage của Proxy.
2. **Storage Collision (Va chạm ô nhớ):** Biến mới phải luôn được khai báo ở CUỐI CÙNG của contract con, không bao giờ được chèn lên đầu hoặc thay đổi kiểu dữ liệu của biến cũ, nếu không slot nhớ sẽ ghi đè làm mất tiền người dùng!`
      }
    ]
  },
  {
    id: 's8',
    title: 'Module 5: Bảo mật Hợp đồng thông minh',
    subtitle: 'Session 8: Reentrancy, Checks-Effects-Interactions & Vòng đời Kiểm toán',
    icon: ShieldAlert,
    summary: 'Mổ xẻ vụ hack kinh điển The DAO, giải mã tấn công Reentrancy và bộ công cụ Static Analysis / Fuzzing / Formal Verification.',
    sections: [
      {
        heading: '1. Vụ hack The DAO & Lỗ hổng Tái thâm nhập (Reentrancy)',
        content: `Reentrancy xảy ra khi một hợp đồng chuyển tiền ra ngoài TRƯỚC KHI cập nhật số dư nội bộ của tài khoản người rút.
* Kẻ tấn công tạo hợp đồng độc hại có hàm \`fallback()\` hoặc \`receive()\`.
* Khi nạn nhân gửi ETH qua \`call{value: amount}("")\`, hàm fallback của hacker được kích hoạt và lập tức gọi ngược lại hàm \`withdraw()\` của nạn nhân trước khi dòng lệnh trừ tiền được thi hành! Vòng lặp rút tiền chạy liên tục đến khi kho tiền bị bòn rút cạn kiệt.`,
        codeExample: `// ❌ LỖI NGUY HIỂM (Vulnerable):
function withdraw() public {
    uint bal = balances[msg.sender];
    require(bal > 0);
    (bool sent, ) = msg.sender.call{value: bal}(""); // External call trước!
    require(sent);
    balances[msg.sender] = 0; // Trừ tiền sau -> BỊ REENTRANCY!
}

//  CÁCH KHẮC PHỤC 1: MẪU THIẾT KẾ CEI (Checks-Effects-Interactions)
function safeWithdraw() public {
    uint bal = balances[msg.sender];
    require(bal > 0);           // 1. Checks
    balances[msg.sender] = 0;   // 2. Effects (Cập nhật trạng thái TRƯỚC)
    (bool sent, ) = msg.sender.call{value: bal}(""); // 3. Interactions (Gửi tiền sau)
    require(sent);
}

//  CÁCH KHẮC PHỤC 2: Dùng ReentrancyGuard của OpenZeppelin
// Thêm modifier nonReentrant vào hàm withdraw()`
      },
      {
        heading: '2. Vòng đời Phát triển An toàn & "Audited != Safe"',
        content: `Tại sao có những dự án kiểm toán bởi 3 công ty top đầu vẫn bị hack hàng trăm triệu USD?
- **Audited $\\neq$ Safe:** Kiểm toán chỉ là đánh giá tại một thời điểm nhất định (snapshot). Nếu deploy với tham số sai, tích hợp Oracle sai cách (Flash loan manipulation), hoặc nâng cấp logic contract mới không kiểm toán lại thì vẫn bay màu!
- **3 Tầng bảo vệ mã nguồn:**
  1. **Static Analysis (Slither):** Quét AST tìm nhanh lỗi reentrancy, biến chưa khởi tạo.
  2. **Property-based Fuzzing (Echidna/Foundry):** Bắn hàng triệu dữ liệu ngẫu nhiên để kiểm tra xem Invariant (bất biến logic) có bị phá vỡ không.
  3. **Formal Verification (Certora):** Chứng minh toán học nghiêm ngặt rằng code luôn tuân thủ đặc tả logic.`
      }
    ]
  },
  {
    id: 's-lab',
    title: 'Module 6: Lab Thực hành & Đề tài Seminar',
    subtitle: 'Nghiên cứu ứng dụng Web3 thực tế & Tổng kết khóa học',
    icon: Award,
    summary: 'Bài tập Lab cào dữ liệu Block 840,000 thực tế, mổ xẻ các vụ sụp đổ Terra/UST, Ronin Bridge và danh mục 12 đề tài Seminar.',
    sections: [
      {
        heading: '1. Lab 4.1 - 4.3: Mạng Bitcoin Mainnet & Block 840,000 (Halving 2024)',
        content: `Thực hành mổ xẻ block halving thứ 4 trong lịch sử Bitcoin:
- Giải mã trường \`bits\` thành giá trị \`target\` PoW thực tế.
- Băm đúp \`dSHA256\` của 80-byte header để kiểm tra điều kiện $\\text{hash} < \\text{target}$.
- Lần theo dòng tiền giao dịch Runes với mức phí kỷ lục 6.73 BTC miner fee chỉ trong 1 giao dịch đơn lẻ!
- Tái tạo Merkle Root từ danh sách 3,050 TxID theo chuẩn băm byte-reverse.`
      },
      {
        heading: '2. Danh mục 12 Đề tài Seminar Nghiên cứu chuyên sâu',
        content: `Các chủ đề thảo luận giữa kỳ dành cho nhóm 3-4 sinh viên:
1. **L2 Deep-dive (Arbitrum / Base):** Kiến trúc Rollup, Fraud proof vs Validity proof.
2. **Post-mortem Terra/UST:** Vòng xoáy tử thần (death spiral) thuật toán mint/burn.
3. **Exploit Ronin Bridge:** Hacker chiếm 5/9 validator thông qua social engineering.
4. **RWA (BlackRock BUIDL):** Token hóa trái phiếu kho bạc Mỹ trên Ethereum.
5. **ZK Applications:** ZK-Rollup và Zero-Knowledge ID.
6. **Restaking & EigenLayer:** Cơ chế tái thế chấp bảo vệ Actively Validated Services (AVS).
7. **Account Abstraction (ERC-4337 & EIP-7702):** Ví smart contract thông minh.
8. **AI-Agent Payments (x402):** Giao thức cho AI tự động thanh toán tài nguyên.
9. **Khung pháp lý tài sản số Việt Nam 2025-2026.**
10. **So sánh quy định Stablecoin: MiCA (Châu Âu) vs GENIUS (Mỹ).**
11. **Bitcoin L2 & Lightning Network.**
12. **Kinh tế học DePIN (Helium & Hivemapper).**`
      }
    ]
  }
];

const QUESTION_BANK = [
  {
    id: 1,
    moduleId: 's4',
    moduleTitle: 'Session 4: Bitcoin & UTXO',
    question: 'Alice sở hữu 1 UTXO có giá trị 0.8 BTC. Cô ấy muốn gửi cho Bob 0.5 BTC với mức phí thợ đào là 0.0001 BTC. Các Output của giao dịch này sẽ là gì?',
    options: [
      '1 output duy nhất: 0.5 BTC trả cho Bob.',
      'Output 1: 0.5 BTC cho Bob; Output 2: 0.2999 BTC tiền thối về Alice.',
      'Output 1: 0.5 BTC cho Bob; Output 2: 0.3 BTC về Alice; Output 3: 0.0001 BTC cho thợ đào.',
      'Output 1: 0.5 BTC cho Bob; Output 2: 0.0001 BTC cho thợ đào.'
    ],
    answer: 1,
    explanation: 'Trong Bitcoin, phí thợ đào là phần dư NGẦM ĐỊNH (implicit fee): Fee = Input - Output. Ta có: 0.8 - 0.5 - 0.0001 = 0.2999 BTC tiền thối gửi lại cho Alice. Phí miner không được tạo thành output riêng.'
  },
  {
    id: 2,
    moduleId: 's4',
    moduleTitle: 'Session 4: Bitcoin & UTXO',
    question: 'Tại sao ngôn ngữ Bitcoin Script lại được Satoshi Nakamoto thiết kế cố ý "KHÔNG Turing-đầy đủ" (Not Turing-complete)?',
    options: [
      'Vì thời điểm năm 2008 máy tính chưa đủ RAM để chạy máy ảo hoàn chỉnh.',
      'Để không có vòng lặp (no loops), code luôn dừng (always halts), triệt tiêu bài toán Halting Problem và không sợ DoS node.',
      'Để bắt buộc các lập trình viên phải chuyển sang dùng mạng Ethereum.',
      'Vì Bitcoin không sử dụng hàm băm trong việc xác minh chữ ký.'
    ],
    answer: 1,
    explanation: 'Không có vòng lặp -> thời gian thực thi luôn có giới hạn hữu hạn (always halts) -> node không bao giờ bị hacker làm treo máy bởi vòng lặp vô tận, đồng thời không cần cơ chế đo đếm Gas phức tạp.'
  },
  {
    id: 3,
    moduleId: 's4',
    moduleTitle: 'Session 4: Thị trường phí & Đồng thuận',
    question: 'Nếu giao dịch Bitcoin của bạn bị kẹt trong Mempool nhiều ngày do set phí chỉ 1 sat/vB, có 2 cách chính thống nào để giải cứu?',
    options: [
      'Gửi email cho Satoshi Nakamoto và gọi điện cho sàn Binance hủy lệnh.',
      'Replace-By-Fee (RBF) và Child-Pays-For-Parent (CPFP).',
      'Chạy lại thuật toán băm SHA-256 và fork mạng lưới.',
      'Tăng kích thước block size lên 8MB và tắt node.'
    ],
    answer: 1,
    explanation: 'RBF (Replace-by-Fee) cho phép người gửi phát lại giao dịch với phí sat/vB cao hơn thay thế giao dịch cũ. CPFP (Child-Pays-For-Parent) cho phép người nhận tạo giao dịch con với mức phí cực cao để thợ đào gom cả giao dịch cha vào block.'
  },
  {
    id: 4,
    moduleId: 's4',
    moduleTitle: 'Session 4: Cơ chế đồng thuận',
    question: 'Trong thuật toán đồng thuận Byzantine kinh điển PBFT (Castro & Liskov 1999), nếu hệ thống có f máy chủ phản bội (Byzantine), số lượng validator tối thiểu n cần thiết để đảm bảo tính an toàn (Safety) là:',
    options: [
      'n >= 2f + 1',
      'n >= 3f + 1',
      'n >= 4f',
      'n >= f + 1'
    ],
    answer: 1,
    explanation: 'PBFT yêu cầu số nút tối thiểu n >= 3f + 1. Ví dụ để chịu đựng được f = 1 node độc hại, mạng cần ít nhất n = 3(1) + 1 = 4 validator và cần hơn 2/3 số node bỏ phiếu đồng thuận.'
  },
  {
    id: 5,
    moduleId: 's4',
    moduleTitle: 'Session 4: Nakamoto Consensus',
    question: 'Kẻ tấn công chiếm được 51% sức mạnh băm (Hashrate) của Bitcoin có thể làm được điều gì sau đây?',
    options: [
      'Chi tiêu toàn bộ số Bitcoin trong ví của Satoshi Nakamoto.',
      'Đổi phần thưởng khối từ 3.125 BTC lên 1,000,000 BTC một cách hợp lệ.',
      'Tổ chức tấn công Reorg chuỗi để thực hiện Double-spending các giao dịch gần đây của chính hắn.',
      'Thay đổi thuật toán chữ ký ECDSA secp256k1 mà không cần các node khác đồng ý.'
    ],
    answer: 2,
    explanation: 'Kẻ tấn công 51% chỉ có thể viết lại lịch sử chuỗi gần nhất để đảo ngược giao dịch của chính mình (Double-spend) hoặc từ chối giao dịch của người khác (Censorship). Hắn KHÔNG THỂ tiêu coin của người khác vì không có khóa bí mật (Private key) hợp lệ!'
  },
  {
    id: 6,
    moduleId: 's5',
    moduleTitle: 'Session 5: Ethereum & EVM',
    question: 'Tại sao từ máy ảo EVM của Ethereum lại được thiết kế dựa trên kiến trúc Stack 256-bit (Word size = 256 bits)?',
    options: [
      'Vì Windows 11 và Linux Ubuntu tương thích tốt nhất với 256-bit.',
      'Vì độ dài này khớp tự nhiên với kích thước đầu ra của hàm băm Keccak-256 và phép toán đường cong elliptic secp256k1.',
      'Để ngăn cản các hacker sử dụng vi xử lý Intel Core i9.',
      'Vì Satoshi Nakamoto yêu cầu Vitalik Buterin làm như vậy.'
    ],
    answer: 1,
    explanation: '256-bit là độ dài tiêu chuẩn của các phép toán mã hóa trong Ethereum: giá trị hàm băm Keccak-256 (32 bytes = 256 bits) và các khóa mật mã trên đường cong elliptic secp256k1.'
  },
  {
    id: 7,
    moduleId: 's5',
    moduleTitle: 'Session 5: Cơ chế EIP-1559',
    question: 'Trong cơ chế định giá phí giao dịch EIP-1559 của Ethereum, khoản BaseFee sẽ đi về đâu?',
    options: [
      'Được chuyển toàn bộ 100% vào tài khoản của Vitalik Buterin.',
      'Được trả cho Validator đề xuất block đó làm tiền thưởng.',
      'Bị đốt cháy vĩnh viễn (Burned) khỏi nguồn cung lưu thông của ETH.',
      'Được gửi vào quỹ bảo hiểm Proof of Stake.'
    ],
    answer: 2,
    explanation: 'Theo chuẩn EIP-1559, BaseFee bị đốt cháy (Burned) hoàn toàn để triệt tiêu động cơ thợ đào tự spam giao dịch giả tạo đẩy giá phí. Validator chỉ nhận được phần tiền bo Priority Tip.'
  },
  {
    id: 8,
    moduleId: 's6-s7',
    moduleTitle: 'Session 6-7: Chuẩn Token & Upgradeable Proxy',
    question: 'Rủi ro lớn nhất của cơ chế 2 bước approve() / transferFrom() trong chuẩn ERC-20 là gì?',
    options: [
      'Giao dịch luôn bị đảo ngược nếu gas limit nhỏ hơn 100,000.',
      'Nguy cơ Frontrunning khi chủ sở hữu thay đổi hạn mức allowance từ N sang M, spender có thể nhanh tay rút cả N lẫn M.',
      'Token ERC-20 không thể chuyển nhượng được trên mạng Sepolia.',
      'Không thể kết hợp với hợp đồng sàn phi tập trung (DEX).'
    ],
    answer: 1,
    explanation: 'Đây là lỗ hổng Allowance Frontrunning kinh điển. Spender có thể theo dõi mempool thấy lệnh sửa allowance từ 50 thành 100 của bạn, nhanh tay trả gas cao để rút 50 trước, sau đó lệnh sửa chạy xong hắn rút tiếp 100 nữa!'
  },
  {
    id: 9,
    moduleId: 's6-s7',
    moduleTitle: 'Session 6-7: Upgradeable Proxy',
    question: 'Khi triển khai mô hình Proxy nâng cấp hợp đồng (ERC-1967 / UUPS), tại sao trong hợp đồng Logic không được dùng constructor mà phải dùng hàm initialize()?',
    options: [
      'Vì Solidity phiên bản 0.8 trở lên đã khai tử từ khóa constructor.',
      'Vì constructor chỉ chạy 1 lần duy nhất trên ngữ cảnh lưu trữ của Logic contract khi deploy, không tác động vào vùng Storage của Proxy contract.',
      'Vì constructor tốn gấp 10 lần phí gas so với initialize().',
      'Vì constructor làm lộ private key của người triển khai.'
    ],
    answer: 1,
    explanation: 'Constructor chỉ khởi tạo trạng thái trên chính contract đó khi deploy. Trong mô hình Proxy, dữ liệu thực tế lại nằm ở vùng Storage của Proxy (chạy qua delegatecall), do đó cần hàm initialize() gọi qua proxy để khởi tạo dữ liệu trong slot của Proxy.'
  },
  {
    id: 10,
    moduleId: 's8',
    moduleTitle: 'Session 8: Bảo mật Smart Contract',
    question: 'Quy tắc thiết kế nào là chìa khóa then chốt để phòng chống lỗ hổng Tái thâm nhập (Reentrancy attack)?',
    options: [
      'Interactions -> Checks -> Effects',
      'Checks -> Effects -> Interactions (CEI pattern)',
      'Effects -> Interactions -> Checks',
      'Sử dụng tx.origin thay cho msg.sender'
    ],
    answer: 1,
    explanation: 'CEI Pattern: 1. Checks (kiểm tra điều kiện require), 2. Effects (cập nhật số dư nội bộ trước), 3. Interactions (mới thực hiện gọi ra bên ngoài hoặc gửi tiền). Cập nhật số dư trước sẽ chặn đứng việc hacker re-enter rút tiếp!'
  },
  {
    id: 11,
    moduleId: 's8',
    moduleTitle: 'Session 8: Bảo mật Smart Contract',
    question: 'Tại sao trong giới bảo mật Web3 có câu nói nổi tiếng "Audited != Safe" (Đã kiểm toán không đồng nghĩa với an toàn)?',
    options: [
      'Vì các công ty kiểm toán luôn cố tình che giấu lỗi để tống tiền dự án.',
      'Vì kiểm toán chỉ đánh giá snapshot code tại thời điểm đó, rủi ro vẫn xảy ra khi deploy sai tham số, thao túng Oracle ngoài phạm vi, hoặc nâng cấp contract mới.',
      'Vì mã nguồn Solidity không thể dịch sang mã máy an toàn.',
      'Vì mạng blockchain không bao giờ có thể kiểm tra lỗi reentrancy.'
    ],
    answer: 1,
    explanation: 'Kiểm toán (Audit) chỉ đảm bảo không có lỗi rõ ràng trong phạm vi code tại thời điểm xem xét. Rất nhiều vụ hack lớn nảy sinh do thao túng giá Flashloan Oracle, cấu hình quyền Admin sai, hoặc sửa đổi code sau khi đã audit.'
  },
  {
    id: 12,
    moduleId: 's1-s3',
    moduleTitle: 'Session 1-3: Mật mã học',
    question: 'Điều gì sau đây là ĐÚNG khi nói về mối quan hệ giữa Private Key, Public Key và Địa chỉ ví trong Ethereum?',
    options: [
      'Private key được tính toán ngược lại từ địa chỉ ví công khai bằng hàm ecrecover.',
      'Địa chỉ ví Ethereum là 20 bytes cuối cùng của mã băm Keccak-256 từ Public Key.',
      'Private key và Public Key hoàn toàn giống nhau về độ dài và giá trị.',
      'Public key được tạo ra ngẫu nhiên rồi nhân với 12 từ khóa BIP-39.'
    ],
    answer: 1,
    explanation: 'Trong Ethereum: Private Key (32 bytes) -> nhân đường cong elliptic secp256k1 ra Public Key (64 bytes không nén) -> băm Keccak-256 -> lấy 20 bytes cuối cùng làm Ethereum Address.'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('curriculum'); // 'curriculum' | 'simulators' | 'quiz' | 'tutor'
  const [selectedModuleId, setSelectedModuleId] = useState('s1-s3');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Simulator States
  const [hashInput, setHashInput] = useState('Blockchain Technology');
  const [hashOutput, setHashOutput] = useState('');
  
  // UTXO Calculator State
  const [utxoInputVal, setUtxoInputVal] = useState('0.8');
  const [utxoSendVal, setUtxoSendVal] = useState('0.5');
  const [utxoFeeRate, setUtxoFeeRate] = useState('20'); // sat/vB
  const [utxoTxSize, setUtxoTxSize] = useState('140'); // vBytes

  // Reentrancy Playground State
  const [bankBalance, setBankBalance] = useState(10);
  const [attackerBalance, setAttackerBalance] = useState(0);
  const [userDeposit, setUserDeposit] = useState(1);
  const [useCEIProtection, setUseCEIProtection] = useState(false);
  const [attackLogs, setAttackLogs] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);

  // Quiz Arena States
  const [quizMode, setQuizMode] = useState('random'); // 'random' | 'module'
  const [quizFilterModule, setQuizFilterModule] = useState('all');
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // AI Tutor States
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'tutor',
      text: 'Chào bạn! Tôi là Trợ giảng AI cho khóa học Blockchain Chuyên sâu. Bạn có câu hỏi nào về mô hình UTXO, EVM 256-bit, cơ chế EIP-1559 hay cách chống tấn công Reentrancy không? Hãy hỏi tôi nhé!'
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function calcHash() {
      if (!window.crypto || !window.crypto.subtle) {
        setHashOutput('Web Crypto API không hỗ trợ');
        return;
      }
      const msgBuffer = new TextEncoder().encode(hashInput);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHashOutput(hashHex);
    }
    calcHash();
  }, [hashInput]);

  useEffect(() => {
    if (activeTab === 'tutor') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const initializeQuiz = (mode = quizMode, mod = quizFilterModule) => {
    setUserAnswers({});
    setQuizSubmitted(false);

    let pool = [...QUESTION_BANK];
    if (mode === 'module' && mod !== 'all') {
      pool = pool.filter(q => q.moduleId === mod);
      if (pool.length === 0) pool = [...QUESTION_BANK];
    }

    // Shuffle array
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const count = mode === 'random' ? Math.min(8, shuffled.length) : Math.min(6, shuffled.length);
    setCurrentQuestions(shuffled.slice(0, count));
  };

  useEffect(() => {
    initializeQuiz('random', 'all');
  }, []);

  const handleSelectAnswer = (qIndex, optIndex) => {
    if (quizSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [qIndex]: optIndex
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    currentQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) correct++;
    });
    return {
      score: correct,
      total: currentQuestions.length,
      percentage: Math.round((correct / currentQuestions.length) * 100)
    };
  };

  const triggerReentrancySimulation = () => {
    setIsAttacking(true);
    setAttackLogs([]);
    let currentBank = bankBalance;
    let attackerLoot = attackerBalance;
    const logs = [];

    logs.push(`🚀 [BẮT ĐẦU] Hacker gửi giao dịch withdraw() đòi rút 1 ETH...`);

    if (useCEIProtection) {
      logs.push(`🛡️ [CHẾ ĐỘ AN TOÀN - CEI ĐANG BẬT]`);
      logs.push(`1. Checks: Kiểm tra balances[attacker] >= 1 ETH -> HỢP LỆ.`);
      logs.push(`2. Effects: Cập nhật balances[attacker] = 0 ETH NGAY LẬP TỨC.`);
      logs.push(`3. Interactions: Chuyển 1 ETH tới hợp đồng hacker.`);
      logs.push(`⚠️ Hàm fallback() của hacker lập tức re-enter gọi lại withdraw()...`);
      logs.push(`🛑 Lần gọi lồng nhau: Checks thấy balances[attacker] == 0 ETH -> BỊ REVERT!`);
      logs.push(`✅ KẾT QUẢ: Tấn công thất bại! Ngân hàng được bảo toàn.`);
      currentBank -= 1;
      attackerLoot += 1;
      setBankBalance(Math.max(0, currentBank));
      setAttackerBalance(attackerLoot);
      setAttackLogs(logs);
      setIsAttacking(false);
    } else {
      logs.push(`❌ [CHẾ ĐỘ NGUY HIỂM - CHƯA BẬT CEI / REENTRANCYGUARD]`);
      let loopCount = 0;
      while (currentBank > 0 && loopCount < 5) {
        loopCount++;
        logs.push(`-> Vòng ${loopCount}: Bank chuyển 1 ETH cho hacker. Số dư nội bộ CHƯA kịp trừ!`);
        logs.push(`-> Fallback của hacker chộp lấy cơ hội, đệ quy gọi tiếp withdraw()...`);
        currentBank -= 2;
        attackerLoot += 2;
      }
      logs.push(`💀 [TOÀN BỘ KHO TIỀN ĐÃ BỊ HÚT CẠN!] Kho bạc ngân hàng cạn kiệt về 0 ETH.`);
      setBankBalance(0);
      setAttackerBalance(attackerLoot + currentBank);
      setAttackLogs(logs);
      setIsAttacking(false);
    }
  };

  const resetBankPlayground = () => {
    setBankBalance(10);
    setAttackerBalance(0);
    setAttackLogs([]);
  };

  const handleSendPrompt = async (promptToSend) => {
    const q = promptToSend || inputQuestion;
    if (!q.trim() || isTutorLoading) return;

    const newMessages = [...chatMessages, { sender: 'user', text: q }];
    setChatMessages(newMessages);
    setInputQuestion('');
    setIsTutorLoading(true);

    const currentMod = MODULES.find(m => m.id === selectedModuleId)?.title;
    const aiAnswer = await callGeminiTutor(q, currentMod);

    setChatMessages([...newMessages, { sender: 'tutor', text: aiAnswer }]);
    setIsTutorLoading(false);
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // UTXO Math calculation
  const calculatedFeeBtc = useMemo(() => {
    const satRate = parseFloat(utxoFeeRate) || 0;
    const size = parseFloat(utxoTxSize) || 0;
    const feeSats = satRate * size;
    return (feeSats / 100000000).toFixed(6);
  }, [utxoFeeRate, utxoTxSize]);

  const calculatedChangeBtc = useMemo(() => {
    const inVal = parseFloat(utxoInputVal) || 0;
    const sendVal = parseFloat(utxoSendVal) || 0;
    const feeVal = parseFloat(calculatedFeeBtc) || 0;
    const change = inVal - sendVal - feeVal;
    return change >= 0 ? change.toFixed(6) : 'Không đủ số dư trả phí!';
  }, [utxoInputVal, utxoSendVal, calculatedFeeBtc]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-black/20">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Blockchain Deep-Dive Academy
            </h1>
            <p className="text-xs text-slate-400">Giáo trình nâng cao & Đấu trường kiến thức</p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'curriculum'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Giáo trình</span>
          </button>

          <button
            onClick={() => setActiveTab('simulators')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'simulators'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span className="hidden sm:inline">Mô phỏng Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Quiz Arena</span>
          </button>

          <button
            onClick={() => setActiveTab('tutor')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'tutor'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="h-4 w-4 text-emerald-300 animate-pulse" />
            <span>AI Tutor</span>
          </button>
        </nav>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
        {/* TAB 1: CURRICULUM & KNOWLEDGE BASE */}
        {activeTab === 'curriculum' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Modules Selection */}
            <div className="lg:col-span-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                Mục lục chương trình (Sessions 1 - 8)
              </h2>
              {MODULES.map(mod => {
                const IconComp = mod.icon;
                const isSelected = selectedModuleId === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start space-x-3.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-950/60 to-slate-900 border-blue-500/60 shadow-lg shadow-blue-950/40 text-white'
                        : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-semibold line-clamp-1 ${
                          isSelected ? 'text-blue-300' : 'text-slate-200'
                        }`}
                      >
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{mod.subtitle}</p>
                    </div>
                  </button>
                );
              })}

              {/* Quick AI Prompt Trigger from Curriculum */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/50">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase">
                  <Sparkles className="h-4 w-4" />
                  <span>Cần trợ giúp chuyên sâu?</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 mb-3">
                  Gặp khái niệm khó hiểu? Hãy mở ngay mục AI Tutor để được giải thích kèm mô hình thực tế.
                </p>
                <button
                  onClick={() => setActiveTab('tutor')}
                  className="w-full py-2 px-3 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Hỏi bài Giảng viên AI</span>
                </button>
              </div>
            </div>

            {/* Main Lesson Content Area */}
            <div className="lg:col-span-8">
              {(() => {
                const current = MODULES.find(m => m.id === selectedModuleId);
                if (!current) return null;
                const IconHeader = current.icon;
                return (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl">
                    <div className="border-b border-slate-800 pb-5 mb-6">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                          <IconHeader className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                          {current.subtitle}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-100">{current.title}</h2>
                      <p className="text-sm text-slate-400 mt-2">{current.summary}</p>
                    </div>

                    {/* Render sections inside module */}
                    <div className="space-y-8">
                      {current.sections.map((sec, sIdx) => (
                        <div key={sIdx} className="space-y-3">
                          <h3 className="text-base font-semibold text-sky-300 flex items-center space-x-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                            <span>{sec.heading}</span>
                          </h3>
                          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line pl-3 border-l-2 border-slate-800">
                            {sec.content}
                          </div>

                          {sec.codeExample && (
                            <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs">
                              <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex justify-between items-center text-slate-400 text-[11px]">
                                <span>Code ví dụ minh họa</span>
                                <button
                                  onClick={() => copyToClipboard(sec.codeExample, sIdx)}
                                  className="flex items-center space-x-1 hover:text-white transition-colors"
                                >
                                  {copiedIndex === sIdx ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                                      <span className="text-emerald-400">Đã copy</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      <span>Copy code</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="p-4 text-emerald-400 overflow-x-auto">
                                <code>{sec.codeExample}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Bottom Quick Test CTA */}
                    <div className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">Đã nắm chắc bài giảng này?</h4>
                        <p className="text-xs text-slate-400">Làm ngay câu hỏi kiểm tra ngẫu nhiên về chủ đề này.</p>
                      </div>
                      <button
                        onClick={() => {
                          setQuizMode('module');
                          setQuizFilterModule(current.id);
                          initializeQuiz('module', current.id);
                          setActiveTab('quiz');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-1.5"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Làm bài Test kiểm tra</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE SIMULATORS & LAB PLAYGROUND */}
        {activeTab === 'simulators' && (
          <div className="space-y-8">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-slate-100 flex items-center space-x-2.5">
                <Cpu className="h-7 w-7 text-cyan-400" />
                <span>Phòng Thí Nghiệm & Mô Phỏng Blockchain Trực Quan</span>
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Tương tác trực tiếp với các cấu trúc cốt lõi: Hiệu ứng thác đổ hàm băm, dòng tiền UTXO và bẻ khóa Reentrancy.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Simulator 1: Hash Avalanche Visualizer */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/40">
                      Module 1 - Mật mã học
                    </span>
                    <Flame className="h-4 w-4 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">1. Hiệu ứng thác đổ SHA-256 (Avalanche Effect)</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                    Hãy thử thêm/bớt hoặc đổi 1 ký tự bất kỳ trong ô input. Bạn sẽ thấy mã băm 256-bit bên dưới thay đổi hoàn toàn tới hơn 50% số bit!
                  </p>

                  <label className="text-xs font-medium text-slate-300 block mb-1.5">Chuỗi dữ liệu đầu vào (Input text):</label>
                  <input
                    type="text"
                    value={hashInput}
                    onChange={e => setHashInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Gõ bất kỳ ký tự nào..."
                  />

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-400">Kết quả SHA-256 (64 ký tự Hex / 256 bits):</span>
                      <span className="text-[11px] text-cyan-400 font-mono">32 bytes fixed</span>
                    </div>
                    <div className="p-3.5 bg-slate-950 border border-cyan-900/40 rounded-xl font-mono text-xs text-cyan-300 break-all select-all shadow-inner">
                      {hashOutput || 'Đang băm...'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-start space-x-2">
                  <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Tính chất này giúp ngăn chặn kẻ tấn công dự đoán ngược lại đầu vào (Preimage Resistance).</span>
                </div>
              </div>

              {/* Simulator 2: UTXO Transaction Fee Calculator */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-800/40">
                      Module 2 - Bài toán Bitcoin Slide 19
                    </span>
                    <Coins className="h-4 w-4 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">2. Máy tính Dòng tiền UTXO & Miner Fee</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                    Mô phỏng bài toán: Alice nạp 1 tờ UTXO, gửi tiền cho Bob, tính số tiền thối (Change) và phí ngầm định cho Thợ đào.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">UTXO Đầu vào (Alice có):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={utxoInputVal}
                        onChange={e => setUtxoInputVal(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">Số BTC trả Bob:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={utxoSendVal}
                        onChange={e => setUtxoSendVal(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">Đơn giá phí (sat/vB):</label>
                      <input
                        type="number"
                        value={utxoFeeRate}
                        onChange={e => setUtxoFeeRate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">Kích thước Tx (vB):</label>
                      <input
                        type="number"
                        value={utxoTxSize}
                        onChange={e => setUtxoTxSize(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Phí thợ đào ngầm định (Fee = sat/vB × vB):</span>
                      <span className="font-mono text-amber-400 font-semibold">{calculatedFeeBtc} BTC</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Tiền thối về ví mới của Alice:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{calculatedChangeBtc} BTC</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
                  ⚠️ Nếu quên không chỉ định Output tiền thối, phần dư sẽ tự động chuyển thành phí cho miner!
                </div>
              </div>
            </div>

            {/* Simulator 3: Full Width Interactive Reentrancy Attack Playground */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-800/40">
                      Module 5 - Session 8 Lab
                    </span>
                    <span className="text-xs text-slate-400">Vụ hack The DAO & Mẫu thiết kế CEI</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mt-2">
                    3. Mô phỏng Tấn công Tái thâm nhập (Reentrancy Attack Playground)
                  </h3>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      id="ceiCheck"
                      checked={useCEIProtection}
                      onChange={e => setUseCEIProtection(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="ceiCheck" className="text-xs font-semibold cursor-pointer text-slate-200">
                      Bật bảo vệ CEI Pattern (Checks-Effects-Interactions)
                    </label>
                  </div>

                  <button
                    onClick={resetBankPlayground}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Khôi phục trạng thái ban đầu"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Status Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Kho bạc Hợp đồng EtherBank:</span>
                    <h4 className="text-2xl font-bold text-sky-400 font-mono mt-1">{bankBalance} ETH</h4>
                  </div>
                  <Database className="h-8 w-8 text-sky-500/40" />
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Ví Hacker (Attacker Contract):</span>
                    <h4 className="text-2xl font-bold text-rose-400 font-mono mt-1">{attackerBalance} ETH</h4>
                  </div>
                  <ShieldAlert className="h-8 w-8 text-rose-500/40" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 mb-6">
                <button
                  disabled={isAttacking || bankBalance === 0}
                  onClick={triggerReentrancySimulation}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center space-x-2 ${
                    isAttacking || bankBalance === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Kích hoạt Hacker gọi withdraw()</span>
                </button>
              </div>

              {/* Console Execution Log */}
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs">
                <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center space-x-2 text-slate-400 text-[11px]">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Nhật ký giao dịch thời gian thực (Execution Traces)</span>
                </div>
                <div className="p-4 space-y-1.5 max-h-60 overflow-y-auto">
                  {attackLogs.length === 0 ? (
                    <span className="text-slate-500">Chưa có giao dịch. Bấm nút đỏ phía trên để bắt đầu thử nghiệm tấn công...</span>
                  ) : (
                    attackLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`${
                          log.includes('CHẾ ĐỘ AN TOÀN') || log.includes('KẾT QUẢ: Tấn công thất bại')
                            ? 'text-emerald-400 font-semibold'
                            : log.includes('HÚT CẠN') || log.includes('CHẾ ĐỘ NGUY HIỂM')
                            ? 'text-rose-400 font-semibold'
                            : 'text-slate-300'
                        }`}
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUIZ ARENA (RANDOM & MODULAR EXAMS) */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {/* Header and Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                  <HelpCircle className="h-6 w-6 text-indigo-400" />
                  <span>Đấu Trường Trắc Nghiệm Blockchain & Đồng Thuận</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Kiểm tra kiến thức ngẫu nhiên hoặc ôn luyện có trọng tâm theo từng Session.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => {
                      setQuizMode('random');
                      initializeQuiz('random', quizFilterModule);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      quizMode === 'random' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Random Toàn khóa (Midterm)
                  </button>
                  <button
                    onClick={() => {
                      setQuizMode('module');
                      initializeQuiz('module', quizFilterModule);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      quizMode === 'module' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Theo từng Module
                  </button>
                </div>

                {quizMode === 'module' && (
                  <select
                    value={quizFilterModule}
                    onChange={e => {
                      setQuizFilterModule(e.target.value);
                      initializeQuiz('module', e.target.value);
                    }}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Tất cả Module</option>
                    <option value="s1-s3">Session 1-3: Mật mã & Merkle</option>
                    <option value="s4">Session 4: Bitcoin & UTXO</option>
                    <option value="s5">Session 5: EVM & Gas</option>
                    <option value="s6-s7">Session 6-7: Token & Proxy</option>
                    <option value="s8">Session 8: Smart Contract Security</option>
                  </select>
                )}

                <button
                  onClick={() => initializeQuiz(quizMode, quizFilterModule)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Tạo Đề Mới</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {currentQuestions.map((q, qIndex) => {
                const isAnswered = userAnswers[qIndex] !== undefined;
                const isCorrect = userAnswers[qIndex] === q.answer;

                return (
                  <div
                    key={q.id}
                    className={`bg-slate-900 border rounded-2xl p-6 shadow-md transition-all ${
                      quizSubmitted
                        ? isCorrect
                          ? 'border-emerald-500/50 bg-emerald-950/10'
                          : 'border-rose-500/50 bg-rose-950/10'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-800/40">
                        {q.moduleTitle}
                      </span>
                      <span className="text-xs text-slate-400">Câu hỏi #{qIndex + 1}</span>
                    </div>

                    <h3 className="text-base font-medium text-slate-100 mb-4">{q.question}</h3>

                    <div className="space-y-2.5">
                      {q.options.map((opt, optIndex) => {
                        const isChosen = userAnswers[qIndex] === optIndex;
                        let optionStyle =
                          'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900';

                        if (isChosen && !quizSubmitted) {
                          optionStyle = 'border-indigo-500 bg-indigo-950/40 text-indigo-200 shadow-sm';
                        } else if (quizSubmitted) {
                          if (optIndex === q.answer) {
                            optionStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-semibold';
                          } else if (isChosen && !isCorrect) {
                            optionStyle = 'border-rose-500 bg-rose-950/40 text-rose-200 line-through';
                          }
                        }

                        return (
                          <button
                            key={optIndex}
                            disabled={quizSubmitted}
                            onClick={() => handleSelectAnswer(qIndex, optIndex)}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && optIndex === q.answer && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
                            )}
                            {quizSubmitted && isChosen && !isCorrect && (
                              <XCircle className="h-4 w-4 text-rose-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Post-submit Explanation Box */}
                    {quizSubmitted && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/50 p-3.5 rounded-xl text-xs space-y-1">
                        <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
                          <Lightbulb className="h-4 w-4 text-amber-400" />
                          <span>Giải thích cặn kẽ từ giảng viên:</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed pl-5">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Submit Action */}
            <div className="sticky bottom-4 bg-slate-900/95 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                {!quizSubmitted ? (
                  <span className="text-xs text-slate-400">
                    Đã hoàn thành: {Object.keys(userAnswers).length} / {currentQuestions.length} câu hỏi
                  </span>
                ) : (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-slate-200">
                      Kết quả của bạn: {calculateScore().score}/{calculateScore().total} điểm ({calculateScore().percentage}%)
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        calculateScore().percentage >= 80
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {calculateScore().percentage >= 80 ? 'Xuất sắc' : 'Cần ôn thêm'}
                    </span>
                  </div>
                )}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(userAnswers).length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Nộp Bài & Chấm Điểm
                </button>
              ) : (
                <button
                  onClick={() => initializeQuiz(quizMode, quizFilterModule)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Làm Lại Đề Khác</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: INTERACTIVE AI TUTOR (GEMINI POWERED) */}
        {activeTab === 'tutor' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[75vh] overflow-hidden">
            {/* Tutor Header */}
            <div className="bg-slate-900/95 border-b border-slate-800 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <span>Gia sư AI Trực Tuyến: TS. Nguyễn Trung Thành & Blockchain TAs</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </h3>
                  <p className="text-xs text-slate-400">Sẵn sàng phân tích kỹ thuật, giải thích slide và code mẫu</p>
                </div>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar">
              <span className="text-[11px] text-slate-400 shrink-0">Hỏi nhanh:</span>
              {[
                'Vì sao Bitcoin Script không có vòng lặp?',
                'Giải thích bài toán 0.8 BTC trả 0.5 BTC slide 19',
                'Storage collision trong Proxy xảy ra thế nào?',
                'Tại sao audited không đồng nghĩa với safe?'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(chip)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 shrink-0 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4 font-sans text-sm">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'tutor' && (
                    <div className="h-8 w-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-2xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-inner'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTutorLoading && (
                <div className="flex items-center space-x-3 text-slate-400 text-xs">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 animate-spin">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <span>Giảng viên AI đang soạn câu trả lời phân tích chuyên sâu...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-950">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendPrompt();
                }}
                className="flex items-center space-x-3"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={e => setInputQuestion(e.target.value)}
                  placeholder="Nhập bất kỳ thắc mắc nào về bài giảng hoặc thuật toán Blockchain..."
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || isTutorLoading}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
                >
                  <span>Gửi</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-400">
        Blockchain Technology and Cryptocurrency • TS. Nguyễn Trung Thành • Đầy đủ Sessions 1 đến 8
      </footer>
    </div>
  );
}