import { Button, Input, Spin, notification } from "antd";
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
import { getUserPoseidonHash } from "./utils/zokrates";
import { ERC20ZKPPermitAddress } from "./constants";

function Setup() {
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const { address = "0x0", isConnected } = useAccount();

  const ERC20ZkPermitContract = {
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
  };

  const {
    data: balanceAndUserHash,
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

      const proof = await getUserPoseidonHash([passwordNumber, "0", address]);
      if (!proof?.inputs) return;

      const [, userPoseidonHash] = proof.inputs;
      setUserHash({
        recklesslySetUnpreparedArgs: [userPoseidonHash as `0x${string}`],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!balanceAndUserHash) return <Spin spinning={true} />;

  return (
    <>
      {contextHolder}
      <p
        style={{
          opacity:
            isWaitingOnTxUserHash || isRefetchingBalanceAndHash ? 0.25 : 1,
        }}
      >
        Current User Hash: {balanceAndUserHash[1].toString()}
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
          Current Balance:{" "}
          {balanceAndUserHash[0].eq(0)
            ? 0
            : balanceAndUserHash[0].div("1000000000000000000").toString()}
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
