import { Button, Input, Spin, notification } from "antd";
import { useState } from "react";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import { ERC20ZKArtifact } from "./Artifacts/ERC20ZK";
import { BigNumber } from "ethers";
import { getUserPoseidonHash } from "./utils/zokrates";

function Setup() {
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const { address = "0x0", isConnected } = useAccount();

  const { data: balance, isLoading: isLoadingBalance } = useContractRead({
    address: "0x33db6af053c189e07cc65e5317e7b449fb1bba7e",
    abi: ERC20ZKArtifact.abi,
    functionName: "balanceOf",
    args: [address],
    watch: true,
    enabled: isConnected,
  });

  const { data: userHash, isLoading: isLoadingUserHash } = useContractRead({
    address: "0x33db6af053c189e07cc65e5317e7b449fb1bba7e",
    abi: ERC20ZKArtifact.abi,
    functionName: "userHash",
    args: [address],
    watch: true,
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
    address: "0x33db6af053c189e07cc65e5317e7b449fb1bba7e",
    abi: ERC20ZKArtifact.abi,
    functionName: "mint",
    args: [address, BigNumber.from("1000")],
    enabled: isConnected,
  });
  const { isLoading: isMintingTokens, write: mint } = useContractWrite({
    ...config,
    onSuccess: ({ hash }) => {
      openNotificationWithIcon("Mint Successful", hash);
    },
  });

  const { isLoading: isSettingUserHash, write: setUserHash } = useContractWrite(
    {
      address: "0x33db6af053c189e07cc65e5317e7b449fb1bba7e",
      abi: ERC20ZKArtifact.abi,
      functionName: "setUserHash",
      mode: "recklesslyUnprepared",
      onSuccess: ({ hash }) => {
        openNotificationWithIcon("Setting User Hash Successful", hash);
      },
    }
  );

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

  return (
    <>
      {contextHolder}
      <p>Current User Hash: {userHash?.toString()}</p>
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
      {!isLoadingBalance && !isLoadingUserHash ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
          }}
        >
          <p>
            Current Balance:{" "}
            {balance?.eq(0)
              ? 0
              : balance?.div("1000000000000000000").toString()}
          </p>
          <Button
            loading={isMintingTokens}
            style={{ marginLeft: "50px" }}
            onClick={mint}
          >
            Mint 10 000 Tokens
          </Button>
        </div>
      ) : (
        <Spin spinning={true} />
      )}
    </>
  );
}

export default Setup;
