"""Lab 3.2 — Merkle tree (starter).

Quy ước (theo Bitcoin) / Convention (Bitcoin rule):
- Lá = sha256(dữ liệu giao dịch). Leaf = sha256(tx bytes).
- Cha = sha256(trái + phải) trên byte digest. Parent = sha256(left + right) over raw digests.
- Tầng lẻ: nhân đôi phần tử cuối. Odd level: duplicate the last element.
"""

import hashlib


def H(b: bytes) -> bytes:
    return hashlib.sha256(b).digest()


def _parent(left: bytes, right: bytes) -> bytes:
    """Hash of one internal node given its two children digests."""
    return H(left + right)


def _next_level(level: list[bytes]) -> list[bytes]:
    """Build the level directly above `level`, duplicating the last node if odd."""
    if len(level) % 2 == 1:
        level = level + [level[-1]]
    return [_parent(level[i], level[i + 1]) for i in range(0, len(level), 2)]


def merkle_root(leaves: list[bytes]) -> bytes:
    """TODO 1: dựng cây từ dưới lên, trả về băm gốc.
    Build bottom-up, return the root digest."""
    if not leaves:
        raise ValueError("leaves must not be empty")

    level = leaves[:]
    while len(level) > 1:
        level = _next_level(level)
    return level[0]


def merkle_proof(leaves: list[bytes], index: int) -> list[tuple[bytes, bool]]:
    """TODO 2: trả về [(sibling_digest, sibling_is_left), ...] từ lá lên gốc.
    Return the sibling path from leaf `index` up to the root."""
    if not (0 <= index < len(leaves)):
        raise IndexError("index out of range")

    path = []
    level = leaves[:]
    pos = index

    while len(level) > 1:
        if len(level) % 2 == 1:
            level = level + [level[-1]]

        if pos % 2 == 0:
            sibling_pos, sibling_is_left = pos + 1, False
        else:
            sibling_pos, sibling_is_left = pos - 1, True

        path.append((level[sibling_pos], sibling_is_left))

        level = _next_level(level)
        pos //= 2

    return path


def verify_proof(leaf_hash: bytes, proof: list[tuple[bytes, bool]], root: bytes) -> bool:
    """TODO 3: tính ngược lên gốc rồi so sánh. Recompute upward and compare."""
    node = leaf_hash
    for sibling_digest, sibling_is_left in proof:
        if sibling_is_left:
            node = _parent(sibling_digest, node)
        else:
            node = _parent(node, sibling_digest)
    return node == root


# ------------------------------------------------------------------ checks
if __name__ == "__main__":
    txs = [f"tx{i}: A->B {i} coin".encode() for i in range(8)]
    leaves = [H(t) for t in txs]

    root = merkle_root(leaves)
    print("root:", root.hex())

    # CHECK 1: proof đúng cho mọi lá / valid proof for every leaf
    ok = all(verify_proof(leaves[i], merkle_proof(leaves, i), root) for i in range(8))
    print("CHECK 1 (all 8 proofs valid):", "OK" if ok else "FAIL")

    # CHECK 2: proof có đúng log2(8)=3 phần tử / proof has exactly 3 elements
    print("CHECK 2 (proof length == 3):", "OK" if len(merkle_proof(leaves, 4)) == 3 else "FAIL")

    # CHECK 3: lá bị sửa phải trượt / a tampered leaf must fail
    fake = H(b"tx4: A->B 999999 coin")
    print(
        "CHECK 3 (tampered leaf fails):",
        "OK" if not verify_proof(fake, merkle_proof(leaves, 4), root) else "FAIL",
    )

    # CHECK 4: số lá lẻ (7) vẫn chạy / odd leaf count (7) still works
    l7 = leaves[:7]
    r7 = merkle_root(l7)
    print(
        "CHECK 4 (odd count works):",
        "OK" if all(verify_proof(l7[i], merkle_proof(l7, i), r7) for i in range(7)) else "FAIL",
    )