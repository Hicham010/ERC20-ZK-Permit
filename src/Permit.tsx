import { useState } from "react";
import { Button, Form, Input, InputNumber, message } from "antd";
import { getPermitZKProof } from "./utils/zokrates";
import { BigNumber, utils } from "ethers";
import { ERC20ZKArtifact } from "./Artifacts/ERC20ZK";
import { Address, useAccount, useContractRead } from "wagmi";
import { ERC20ZKPPermitAddress, MAX_FIELD_VALUE } from "./constants";
import { buildPoseidon } from "circomlibjs";

function Permit({ setProof, setCompoundHash, setFormValues }) {
  const [loading, setLoading] = useState<boolean>(false);
  const { address = "0x0", isConnected } = useAccount();
  const { data: zknNonce } = useContractRead({
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
    functionName: "zkNonce",
    args: [address],
    watch: true,
    enabled: isConnected,
  });

  const { data: onChainUserHash } = useContractRead({
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
    functionName: "userHash",
    args: [address],
    watch: true,
    enabled: isConnected,
  });

  const { data: balance } = useContractRead({
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
    functionName: "balanceOf",
    args: [address],
    watch: true,
    enabled: isConnected,
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
        userHash,
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
      message.error("Something went wrong generating the proof" + err);
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
        hasFeedback
        rules={[
          { required: true, len: 42 },
          () => ({
            validator(_, ownerAddress) {
              if (utils.isAddress(ownerAddress)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("The owner address is not a valid Ethereum address")
              );
            },
          }),
        ]}
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
              // console.log(receiverAddress);
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
          max={
            balance?.eq(0) ? 0 : balance?.div("1000000000000000000").toNumber()
          }
          addonAfter={`/ ${
            balance?.eq(0) ? 0 : balance?.div("1000000000000000000").toString()
          }`}
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
