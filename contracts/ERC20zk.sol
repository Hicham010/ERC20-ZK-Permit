// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Verifier} from "./PermitZkVerifier.sol";

contract ERC20ZK is ERC20, Verifier {
    uint public constant MAX_FIELD_VALUE =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    struct PermitZK {
        address owner;
        address receiver;
        uint value;
        uint deadline;
    }

    mapping(address => bytes32) public userHash;
    mapping(address => uint) public zkNonce;

    constructor() ERC20("ZK-Coin", "ZKC") {
        _mint(msg.sender, 1_000_00 * 1e18);
    }

    function mint(address receiver, uint amount) external {
        _mint(receiver, amount * 1e18);
    }

    function setUserHash(bytes32 _userHash) external {
        require(MAX_FIELD_VALUE > uint(_userHash), "Userhash not allowed");
        userHash[msg.sender] = _userHash;
    }

    function zkTransferFrom(
        Proof memory proof,
        PermitZK memory permitZK,
        bytes32 compoundHash
    ) external {
        require(MAX_FIELD_VALUE > permitZK.value, "Transfer amount too high");
        require(block.timestamp < permitZK.deadline, "Deadline expired");

        uint ownerUint = uint256(uint160(permitZK.owner));
        uint receiverUint = uint256(uint160(permitZK.receiver));
        uint _zkNonce = zkNonce[permitZK.owner];
        uint _userHash = uint(userHash[permitZK.owner]);

        uint[7] memory input = [
            uint(ownerUint),
            receiverUint,
            permitZK.value,
            permitZK.deadline,
            _zkNonce,
            _userHash,
            uint(compoundHash)
        ];
        require(verifyTx(proof, input), "Proof is invalid");

        _transfer(permitZK.owner, permitZK.receiver, permitZK.value);
        zkNonce[permitZK.owner]++;
    }
}
