import { Button, Input, notification } from "antd";
import { useState } from "react";
import {
  useAccount,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ERC20ZKArtifact } from "./Artifacts/ERC20ZK";
import { BigNumber, constants } from "ethers";
import { ERC20ZKPPermitAddress } from "./constants";
import { buildPoseidon } from "circomlibjs";

function Setup() {
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const { address = constants.AddressZero, isConnected } = useAccount();

  const ERC20ZkPermitContract = {
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
    args: [address],
  } as const;

  const {
    data: [balance, onChainUserHash] = [constants.Zero, constants.HashZero],
    refetch: refetchBalanceAndHash,
    isRefetching: isRefetchingBalanceAndHash,
  } = useContractReads({
    contracts: [
      {
        ...ERC20ZkPermitContract,
        functionName: "balanceOf",
      },
      {
        ...ERC20ZkPermitContract,
        functionName: "userHash",
      },
    ],
    enabled: isConnected,
  });

  const openNotificationWithIcon = (title: string, transactionHash: string) => {
    api["success"]({
      message: title,
      description: (
        <a
          href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
          target="_blank"
        >
          Transaction Link
        </a>
      ),
    });
  };

  const { config } = usePrepareContractWrite({
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
    functionName: "mint",
    args: [address, BigNumber.from("1000")],
    enabled: isConnected,
  });
  const {
    data: mintingReceipt,
    isLoading: isMintingTokens,
    write: mint,
  } = useContractWrite({
    ...config,
    onSuccess: ({ hash }) => {
      openNotificationWithIcon("Mint Successful", hash);
    },
  });

  const {
    data: userHashReceipt,
    isLoading: isSettingUserHash,
    write: setUserHash,
  } = useContractWrite({
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
    functionName: "setUserHash",
    mode: "recklesslyUnprepared",
    onSuccess: ({ hash }) => {
      openNotificationWithIcon("Setting User Hash Successful", hash);
    },
  });

  const { isLoading: isWaitingOnTxMint } = useWaitForTransaction({
    hash: mintingReceipt?.hash,
    onSuccess() {
      refetchBalanceAndHash();
    },
  });

  const { isLoading: isWaitingOnTxUserHash } = useWaitForTransaction({
    hash: userHashReceipt?.hash,
    onSuccess() {
      refetchBalanceAndHash();
    },
  });

  const handleUserHash = async () => {
    if (!address) return;
    if (!setUserHash) return;

    setLoading(true);
    try {
      const passwordNumber = BigNumber.from(
        "0x" + Buffer.from(password).toString("hex")
      ).toString();

      const poseidon = await buildPoseidon();
      const hash = poseidon.F.toString(
        poseidon([passwordNumber, "0", address])
      );
      const userPoseidonHash = BigNumber.from(
        hash
      ).toHexString() as `0x${string}`;

      setUserHash({
        recklesslySetUnpreparedArgs: [userPoseidonHash],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <p
        style={{
          opacity:
            isWaitingOnTxUserHash || isRefetchingBalanceAndHash ? 0.25 : 1,
        }}
      >
        Current User Hash: {onChainUserHash}
      </p>
      <div style={{ display: "flex" }}>
        <Input
          maxLength={30}
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          disabled={password.length < 8}
          loading={loading || isSettingUserHash}
          style={{ marginLeft: "50px" }}
          onClick={handleUserHash}
        >
          Set Password
        </Button>
      </div>
      <br />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
        }}
      >
        <p
          style={{
            opacity: isWaitingOnTxMint || isRefetchingBalanceAndHash ? 0.25 : 1,
          }}
        >
          Current Balance: {balance.div(`${1e18}`).toString()}
        </p>
        <Button
          loading={isMintingTokens}
          style={{ marginLeft: "50px" }}
          onClick={mint}
        >
          Mint 10 000 Tokens
        </Button>
      </div>
    </>
  );
}

export default Setup;
