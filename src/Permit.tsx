import { Button, Form, Input, InputNumber, message } from "antd";
import { useState } from "react";
import { isAddress, numberToHex, toHex, zeroAddress, type Hash } from "viem";
import { useAccount, useContractReads } from "wagmi";
import { ERC20ZkPermitContract, MAX_FIELD_VALUE, ZERO_HASH } from "./constants";
import type { Groth16Proof, PermitFormInputs } from "./types";
import { getPermitZKProof, type PermitProofInput } from "./utils/zokrates";

type PermitComp = {
  setProof: (proof: Groth16Proof | null) => void;
  setCompoundHash: (compoundHash: Hash | null) => void;
  setPermitFormInputs: (permitFormInputs: PermitFormInputs) => void;
};

export default function Permit({
  setProof,
  setCompoundHash,
  setPermitFormInputs,
}: PermitComp) {
  const [loading, setLoading] = useState(false);
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

  let [zknNonce, onChainUserHash, balance] = [0n, ZERO_HASH, 0n];
  if (data && data[0]?.result && data[1]?.result && data[2]?.result) {
    [zknNonce, onChainUserHash, balance] = [
      data[0].result,
      data[1].result,
      data[2].result,
    ];
  }

  async function onFinish(values: PermitFormInputs) {
    console.log("Supplied values: ", values);
    setPermitFormInputs(values);
    setLoading(true);
    try {
      const passwordNumber = BigInt(toHex(values.password));
      const passwordSaltNumber = 0n;
      const ownerAddressNumber = BigInt(values.owner);
      const receiverAddressNumber = BigInt(values.receiver);
      const valueNumber = BigInt(values.value) * BigInt(1e18);
      const deadline = MAX_FIELD_VALUE - 2n;
      const nonce = zknNonce;

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

      const userHashHex = numberToHex(BigInt(userHash), { size: 32 });
      const compoundHashHex = numberToHex(BigInt(compoundHash), { size: 32 });

      if (onChainUserHash === userHashHex) {
        message.success("The supplied password is correct");
      } else {
        message.error("The supplied password is incorrect");
      }

      const input: PermitProofInput = [
        passwordNumber.toString(),
        passwordSaltNumber.toString(),
        ownerAddressNumber.toString(),
        receiverAddressNumber.toString(),
        valueNumber.toString(),
        deadline.toString(),
        nonce.toString(),
        onChainUserHash,
        compoundHash,
      ];
      console.log("The permit proof inputs are", { input });

      const { proof, isVerified } = await getPermitZKProof(input);

      if (isVerified) {
        message.success("The proof is valid");
      } else {
        message.error("The proof is invalid");
      }

      setCompoundHash(compoundHashHex);
      setProof(proof as Groth16Proof);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        message.error(
          "Something went wrong generating the proof: " + err.message
        );
      }
      setCompoundHash(null);
      setProof(null);
    }
    setLoading(false);
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
