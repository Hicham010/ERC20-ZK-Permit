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
import { BigNumber } from "ethers";
import { ERC20ZKPPermitAddress, ZERO_ADDRESS, ZERO_HASH } from "./constants";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { buildPoseidon } from "circomlibjs";
import { pad as hexZeroPad, toHex } from "viem";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";

function Setup() {
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const { address = ZERO_ADDRESS, isConnected } = useAccount();
  const addTransaction = useAddRecentTransaction();

  const ERC20ZkPermitContract = {
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
  } as const;

  const {
    data,
    refetch: refetchBalanceAndHash,
    isRefetching: isRefetchingBalanceAndHash,
  } = useContractReads({
    contracts: [
      {
        ...ERC20ZkPermitContract,
        functionName: "balanceOf",
        args: [address],
      },
      {
        ...ERC20ZkPermitContract,
        functionName: "userHash",
        args: [address],
      },
    ],
    enabled: isConnected,
    watch: true,
  });

  let [balance, onChainUserHash] = [0n, ZERO_HASH];
  if (data && Array.isArray(data) && data[0]?.result && data[1]?.result) {
    [balance, onChainUserHash] = [data[0]?.result, data[1]?.result];
  }

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
    ...ERC20ZkPermitContract,
    functionName: "mint",
    args: [address, 1000n],
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
      addTransaction({ hash, description: "Minted Tokens" });
    },
  });

  const {
    data: userHashReceipt,
    isLoading: isSettingUserHash,
    write: setUserHash,
  } = useContractWrite({
    ...ERC20ZkPermitContract,
    functionName: "setUserHash",
    onSuccess: ({ hash }) => {
      openNotificationWithIcon("Setting User Hash Successful", hash);
      addTransaction({ hash, description: "Setted new userhash" });
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
    if (!setUserHash) return;

    setLoading(true);
    try {
      const passwordNumber = BigNumber.from(toHex(password)).toString();
      const passwordSalt = "0";

      const poseidon = await buildPoseidon();
      const hash = poseidon.F.toString(
        poseidon([passwordNumber, passwordSalt, address])
      );
      const userPoseidonHash = hexZeroPad(
        BigNumber.from(hash).toHexString() as `0x${string}`,
        {
          size: 32,
        }
      );

      setUserHash({
        args: [userPoseidonHash],
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
          Current Balance: {(balance / BigInt(1e18)).toString()}
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
