import { useState } from "react";
import { Button, Form, Input, InputNumber, message } from "antd";
import { getPermitZKProof } from "./utils/zokrates";
import { BigNumber, constants, utils } from "ethers";
import { ERC20ZKArtifact } from "./Artifacts/ERC20ZK";
import { Address, useAccount, useContractReads } from "wagmi";
import { ERC20ZKPPermitAddress, MAX_FIELD_VALUE } from "./constants";
import { buildPoseidon } from "circomlibjs";

function Permit({ setProof, setCompoundHash, setFormValues }) {
  const [loading, setLoading] = useState<boolean>(false);
  const { address = constants.AddressZero, isConnected } = useAccount();

  const ERC20ZkPermitContract = {
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
    args: [address],
  } as const;

  const {
    data: [zknNonce, onChainUserHash, balance] = [
      constants.Zero,
      constants.HashZero,
      constants.Zero,
    ],
  } = useContractReads({
    contracts: [
      { ...ERC20ZkPermitContract, functionName: "zkNonce" },
      { ...ERC20ZkPermitContract, functionName: "userHash" },
      { ...ERC20ZkPermitContract, functionName: "balanceOf" },
    ],
    enabled: isConnected,
    staleTime: 4_000,
  });

  async function onFinish(values: {
    password: string;
    owner: Address;
    receiver: Address;
    value: number;
  }) {
    console.log("Supplied values: ", values);
    setFormValues(values);
    setLoading(true);
    try {
      if (!zknNonce) return;
      if (!onChainUserHash) return;

      const passwordNumber = BigNumber.from(
        "0x" + Buffer.from(values.password).toString("hex")
      ).toString();
      const passwordSaltNumber = "0";
      const ownerAddressNumber = BigNumber.from(values.owner).toString();
      const receiverAddressNumber = BigNumber.from(values.receiver).toString();
      const valueNumber = `${BigInt(values.value) * BigInt(1e18)}`;
      const deadline = `${MAX_FIELD_VALUE - 2n}`;
      const nonce = zknNonce.toString();

      const input: [string, string, string, string, string, string, string] = [
        passwordNumber,
        passwordSaltNumber,
        ownerAddressNumber,
        receiverAddressNumber,
        valueNumber,
        deadline,
        nonce,
      ];

      console.log("Initial inputs: ", input);

      const poseidon = await buildPoseidon();

      const userHash = poseidon.F.toString(
        poseidon([passwordNumber, "0", address])
      );
      const transferHash = poseidon.F.toString(
        poseidon([receiverAddressNumber, valueNumber, deadline, nonce])
      );
      const compoundHash = poseidon.F.toString(
        poseidon([userHash, transferHash])
      );

      const userHashHex = BigNumber.from(
        userHash
      ).toHexString() as `0x${string}`;

      const compoundHashHex = BigNumber.from(
        compoundHash
      ).toHexString() as `0x${string}`;

      console.log([...input, userHash, compoundHash]);

      if (onChainUserHash === userHashHex) {
        message.success("The supplied password is correct");
      } else {
        message.error("The supplied password is wrong");
      }

      const { proof, isVerified } = await getPermitZKProof([
        ...input,
        onChainUserHash,
        compoundHash,
      ]);

      if (isVerified) {
        message.success("The proof is valid");
      } else {
        message.error("The proof is invalid");
      }

      setCompoundHash(compoundHashHex);
      setProof(proof);
    } catch (err) {
      console.error(err);
      message.error("Something went wrong generating the proof");
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
        <Input />
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
              if (utils.isAddress(receiverAddress)) {
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
        hasFeedback
        rules={[{ required: true }]}
        label="Value"
        name="value"
      >
        <InputNumber
          style={{ width: "100%" }}
          max={balance?.div(`${1e18}`).toNumber()}
          addonAfter={`/ ${balance?.div(`${1e18}`).toString()}`}
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

export default Permit;
