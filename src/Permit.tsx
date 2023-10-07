import { Button, Form, Input, InputNumber, message } from "antd";
import { useState } from "react";
import { pad as hexZeroPad, isAddress, toHex, zeroAddress } from "viem";
import { Address, useAccount, useContractReads } from "wagmi";
import { ERC20ZkPermitContract, MAX_FIELD_VALUE, ZERO_HASH } from "./constants";
import { Groth16Proof, HashType, PermitFormInputs } from "./types";
import { getPermitZKProof } from "./utils/zokrates";

type PermitComp = {
  setProof: React.Dispatch<React.SetStateAction<Groth16Proof | null>>;
  setCompoundHash: React.Dispatch<React.SetStateAction<HashType | null>>;
  setPermitFormInputs: React.Dispatch<
    React.SetStateAction<PermitFormInputs | null>
  >;
};

export default function Permit({
  setProof,
  setCompoundHash,
  setPermitFormInputs,
}: PermitComp) {
  const [loading, setLoading] = useState<boolean>(false);
  const { address = zeroAddress, isConnected } = useAccount();

  const ERC20ZkPermitContractWithArgs = {
    ...ERC20ZkPermitContract,
    args: [address],
  } as const;

  const { data } = useContractReads({
    contracts: [
      { ...ERC20ZkPermitContractWithArgs, functionName: "zkNonce" },
      { ...ERC20ZkPermitContractWithArgs, functionName: "userHash" },
      { ...ERC20ZkPermitContractWithArgs, functionName: "balanceOf" },
    ],
    enabled: isConnected,
    watch: true,
  });

  let [zknNonce, onChainUserHash, balance]: [bigint, `0x${string}`, bigint] = [
    0n,
    ZERO_HASH,
    0n,
  ];
  if (
    data &&
    Array.isArray(data) &&
    data[0]?.result &&
    data[1]?.result &&
    data[2]?.result
  ) {
    [zknNonce, onChainUserHash, balance] = [
      data[0].result,
      data[1].result,
      data[2].result,
    ];
  }

  async function onFinish(values: {
    password: string;
    owner: Address;
    receiver: Address;
    value: number;
  }) {
    console.log("Supplied values: ", values);
    setPermitFormInputs(values);
    setLoading(true);
    try {
      const passwordNumber = BigInt(toHex(values.password)).toString();
      const passwordSaltNumber = "0";
      const ownerAddressNumber = BigInt(values.owner).toString();
      const receiverAddressNumber = BigInt(values.receiver).toString();
      const valueNumber = `${BigInt(values.value) * BigInt(1e18)}`;
      const deadline = `${MAX_FIELD_VALUE - 2n}`;
      const nonce = zknNonce.toString();

      const input = [
        passwordNumber,
        passwordSaltNumber,
        ownerAddressNumber,
        receiverAddressNumber,
        valueNumber,
        deadline,
        nonce,
      ] as const;

      const { buildPoseidon } = await import("circomlibjs");
      const poseidon = await buildPoseidon();

      const userHash: string = poseidon.F.toString(
        poseidon([passwordNumber, passwordSaltNumber, address])
      );
      const transferHash: string = poseidon.F.toString(
        poseidon([receiverAddressNumber, valueNumber, deadline, nonce])
      );
      const compoundHash: string = poseidon.F.toString(
        poseidon([userHash, transferHash])
      );

      const userHashHex = hexZeroPad(`0x${BigInt(userHash).toString(16)}`, {
        size: 32,
      });
      const compoundHashHex = hexZeroPad(
        `0x${BigInt(compoundHash).toString(16)}`,
        { size: 32 }
      );

      console.log({ input, userHash, compoundHash });
      // eslint-disable-next-line no-debugger
      debugger;
      if (onChainUserHash === userHashHex) {
        message.success("The supplied password is correct");
      } else {
        message.error("The supplied password is incorrect");
      }

      const { proof, isVerified } = (await getPermitZKProof([
        ...input,
        onChainUserHash,
        compoundHash,
      ])) as { proof: Groth16Proof; isVerified: boolean };

      if (isVerified) {
        message.success("The proof is valid");
      } else {
        message.error("The proof is invalid");
      }

      setCompoundHash(compoundHashHex);
      setProof(proof);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        message.error(
          "Something went wrong generating the proof: " + err.message
        );
      }
      setCompoundHash(null);
      setProof(null);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Form
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        hasFeedback
        rules={[{ required: true, min: 8, max: 30 }]}
        label="Password"
        name="password"
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        label="Owner Address"
        name="owner"
        initialValue={address}
      >
        <Input disabled />
      </Form.Item>
      <Form.Item
        hasFeedback
        rules={[
          { required: true, len: 42 },
          () => ({
            validator(_, receiverAddress) {
              if (isAddress(receiverAddress)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(
                  "The receiver address is not a valid Ethereum address"
                )
              );
            },
          }),
        ]}
        label="Receiver Address"
        name="receiver"
      >
        <Input />
      </Form.Item>
      <Form.Item
        hasFeedback={false}
        rules={[{ required: true }]}
        label="Value"
        name="value"
      >
        <InputNumber
          style={{ width: "100%" }}
          max={parseInt((balance / BigInt(1e18)).toString())}
          addonAfter={`/ ${(balance / BigInt(1e18)).toString()}`}
          controls={false}
        />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
        >
          Create Permit
        </Button>
      </Form.Item>
    </Form>
  );
}
