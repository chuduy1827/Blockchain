from eth_account import Account
from eth_account.messages import encode_defunct

acct = Account.create()

print("address:", acct.address)

msg = encode_defunct(
    text="I attended Session 3 / Tôi đã học Buổi 3"
)

sig = Account.sign_message(msg, acct.key)

sig2 = Account.sign_message(msg, acct.key)

print("same signature:", sig.signature == sig2.signature)

print("r,s,v:", hex(sig.r), hex(sig.s), sig.v)

who = Account.recover_message(
    msg,
    signature=sig.signature
)

print("recovered:", who, "| match:", who == acct.address)

bad = encode_defunct(
    text="I attended Session 3 / Tôi đã học Buổi 4"
)

print(
    "tampered ->",
    Account.recover_message(
        bad,
        signature=sig.signature
    )
)