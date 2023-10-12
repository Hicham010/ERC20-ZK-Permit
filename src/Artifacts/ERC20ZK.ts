export const ERC20ZKArtifact = {
  contractName: "ERC20ZK",
  sourceName: "contracts/ERC20zk.sol",
  abi: [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [],
      name: "MAX_FIELD_VALUE",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
      ],
      name: "allowance",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [
        {
          internalType: "uint8",
          name: "",
          type: "uint8",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "subtractedValue",
          type: "uint256",
        },
      ],
      name: "decreaseAllowance",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "addedValue",
          type: "uint256",
        },
      ],
      name: "increaseAllowance",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "receiver",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "mint",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "_userHash",
          type: "bytes32",
        },
      ],
      name: "setUserHash",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "transfer",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "transferFrom",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "userHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            {
              components: [
                {
                  internalType: "uint256",
                  name: "X",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "Y",
                  type: "uint256",
                },
              ],
              internalType: "struct Pairing.G1Point",
              name: "a",
              type: "tuple",
            },
            {
              components: [
                {
                  internalType: "uint256[2]",
                  name: "X",
                  type: "uint256[2]",
                },
                {
                  internalType: "uint256[2]",
                  name: "Y",
                  type: "uint256[2]",
                },
              ],
              internalType: "struct Pairing.G2Point",
              name: "b",
              type: "tuple",
            },
            {
              components: [
                {
                  internalType: "uint256",
                  name: "X",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "Y",
                  type: "uint256",
                },
              ],
              internalType: "struct Pairing.G1Point",
              name: "c",
              type: "tuple",
            },
          ],
          internalType: "struct Verifier.Proof",
          name: "proof",
          type: "tuple",
        },
        {
          internalType: "uint256[7]",
          name: "input",
          type: "uint256[7]",
        },
      ],
      name: "verifyTx",
      outputs: [
        {
          internalType: "bool",
          name: "r",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "zkNonce",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            {
              components: [
                {
                  internalType: "uint256",
                  name: "X",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "Y",
                  type: "uint256",
                },
              ],
              internalType: "struct Pairing.G1Point",
              name: "a",
              type: "tuple",
            },
            {
              components: [
                {
                  internalType: "uint256[2]",
                  name: "X",
                  type: "uint256[2]",
                },
                {
                  internalType: "uint256[2]",
                  name: "Y",
                  type: "uint256[2]",
                },
              ],
              internalType: "struct Pairing.G2Point",
              name: "b",
              type: "tuple",
            },
            {
              components: [
                {
                  internalType: "uint256",
                  name: "X",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "Y",
                  type: "uint256",
                },
              ],
              internalType: "struct Pairing.G1Point",
              name: "c",
              type: "tuple",
            },
          ],
          internalType: "struct Verifier.Proof",
          name: "proof",
          type: "tuple",
        },
        {
          components: [
            {
              internalType: "address",
              name: "owner",
              type: "address",
            },
            {
              internalType: "address",
              name: "receiver",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "value",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "deadline",
              type: "uint256",
            },
          ],
          internalType: "struct ERC20ZK.PermitZK",
          name: "permitZK",
          type: "tuple",
        },
        {
          internalType: "bytes32",
          name: "compoundHash",
          type: "bytes32",
        },
      ],
      name: "zkTransferFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
} as const;
