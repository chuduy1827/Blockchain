# Lab 03 — Hash, Merkle Tree & Digital Signatures

## Lab 3.1 — Hash Properties & Toy Proof-of-Work

### Q1. Each extra leading zero multiplies expected work by approximately how much? Why?

Each extra leading zero multiplies the expected work by **≈ 16**.
SHA-256 is treated as a random oracle: each hex character of the digest is
essentially uniformly random over 16 possible values (0–f). The
probability that a hash starts with exactly one more "0" hex digit is
1/16, so on average you need 16× more tries (nonces) to find it. This
matches the run above — the nonce count roughly grows ×16 per level
(k=4 → 14,229; k=5 → 55,980, close to a ×16 jump when normalized for
randomness variance).

### Q2. Verifying your found nonce takes how many hash calls? What does this say about PoW?

Verifying a found nonce takes exactly **1 hash call** — you just
recompute `sha256(data + nonce)` once and check the prefix. This
asymmetry (hard to _find_, cheap to _verify_) is the core property that
makes Proof-of-Work useful: miners must burn real computation to find a
valid nonce, but any node can confirm validity almost instantly with a
single hash.

---

## Lab 3.2 — Merkle Tree

### Check Results

```text
CHECK merkle_root: OK
CHECK merkle_proof: OK
CHECK verify_proof: OK
```

### Q3. For n = 1,000,000 transactions, the tree has height

⌈log₂(1,000,000)⌉ = **20** levels (2²⁰ = 1,048,576 ≥ 1,000,000). A Merkle
proof contains one sibling hash per level from leaf to root, so it
contains **about 20 hashes** — regardless of how large n gets, the proof
size grows only logarithmically.

### Q4. Explain one real system that uses exactly this mechanism.

**SPV (Simplified Payment Verification)** in Bitcoin is a direct
real-world use of this exact mechanism. A lightweight wallet doesn't
download full blocks; it only keeps block headers (which include the
Merkle root) and asks a full node for a Merkle proof that a specific
transaction is included in a block. The wallet recomputes the hashes up
to the root and compares against the header's root — proving inclusion
without trusting the full node and without storing the entire
transaction set. The same pattern (publish one root, hand each user a
short proof) is also used by **airdrop/whitelist claim contracts** and
**proof-of-reserves** audits.

---

## Lab 3.3 — Digital Signatures

### Task 1 — Sign the same message twice

The same message was signed twice using the same private key.

Output:

```text
same signature: True
```

Therefore, the two signatures are identical.

This demonstrates deterministic ECDSA signing in this implementation. The deterministic generation of the ECDSA nonce is specified by **RFC 6979**.

### Task 2 — Tamper with the message

The original message was:

```text
I attended Session 3 / Tôi đã học Buổi 3
```

The generated address was:

```text
0x13EEc8F0e378F9612eC9b83bC3EF356ba97dC813
```

The recovered address from the original message and signature was:

```text
recovered: 0x13EEc8F0e378F9612eC9b83bC3EF356ba97dC813 | match: True
```

This shows that the signature correctly corresponds to the original message and signer.

The message was then modified to:

```text
I attended Session 3 / Tôi đã học Buổi 4
```

while keeping the original signature.

The recovered address became:

```text
tampered -> 0xC5B265ACb13051eBCd38B5Cc4178008f75D4323A
```

The recovered address is different from the original signer's address. This demonstrates **message integrity**: if the message is modified, the original signature no longer corresponds to the original signer/message combination.

### Lab 3.3 Output

```text
address: 0x13EEc8F0e378F9612eC9b83bC3EF356ba97dC813
same signature: True
r,s,v: 0xe9736110159f7d9669ef93ef070fb7f33eecb918e965d7b6db7dc4bd74a0212d 0x7bdd3ce30b97175f8149137f907cbb2fea127fddd79e5b68b930d203370b3d06 28
recovered: 0x13EEc8F0e378F9612eC9b83bC3EF356ba97dC813 | match: True
tampered -> 0xC5B265ACb13051eBCd38B5Cc4178008f75D4323A
```

```




```
