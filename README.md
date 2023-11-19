# ERC20-ZK-Permit

An ERC20 implementation using zk-proofs to create permits to approve others to transfer their tokens. Like ERC-2612 but instead of signed approvals it uses an user-hash that is associated to an Ethereum address where the user knows the pre-image of the hash.

The user-hash contains the password and a salt of the user. The owner of the asset can create permits by generating zk-proofs of this user-hash to allow others to transfer tokens on their behave.
