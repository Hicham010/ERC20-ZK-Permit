import {
  useAccount,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ERC20ZKArtifact } from "./Artifacts/ERC20ZK";
import { Button, Spin, message, notification } from "antd";
import { BigNumber } from "ethers";
import { ERC20ZKPPermitAddress, MAX_FIELD_VALUE } from "./constants";

export default function Confirm({ proof, compoundHash, formValues }) {
  const ERC20ZkPermitContract = {
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
  };

  const { isConnected } = useAccount();
  const {
    data: balance,
    refetch: refetchBalance,
    isRefetching: isRefetchingBalance,
  } = useContractReads({
    contracts: [
      {
        ...ERC20ZkPermitContract,
        functionName: "balanceOf",
        args: [formValues.owner],
      },
      {
        ...ERC20ZkPermitContract,
        functionName: "balanceOf",
        args: [formValues.receiver],
      },
    ],
    enabled: isConnected,
  });

  const {
    config,
    isError,
    isLoading: isPreparingZKTransfer,
  } = usePrepareContractWrite({
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
    functionName: "zkTransferFrom",
    args: [
      proof,
      {
        owner: formValues.owner,
        receiver: formValues.receiver,
        value: BigNumber.from(`${BigInt(formValues.value) * BigInt(1e18)}`),
        deadline: BigNumber.from(`${MAX_FIELD_VALUE - 2n}`),
      },
      compoundHash,
    ],
    enabled: isConnected,
    onError(err) {
      if (!("reason" in err)) return;

      message.error("Something went wrong: " + err.reason);
    },
  });
  const { data, isLoading, write } = useContractWrite({
    ...config,
    onSuccess: ({ hash }) => {
      openNotificationWithIcon(hash);
    },
  });

  const { isLoading: isWaitingOnTx } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess() {
      refetchBalance();
    },
  });

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (transactionHash: string) => {
    api["success"]({
      message: "Transfer Successful",
      description: (
        <>
          <p>{formValues.value} tokens transferred.</p>
          <p>From: {formValues.owner}</p>
          <p>to: {formValues.receiver}</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
            target="_blank"
          >
            Transaction Link
          </a>
        </>
      ),
    });
  };

  return (
    <div>
      {contextHolder}
      {/* TODO: Use antd Description Component */}
      {balance ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <p
            style={{
              opacity: isWaitingOnTx || isRefetchingBalance ? 0.25 : 1,
              margin: "5px",
            }}
          >
            Current Owner Balance:{" "}
            {balance[0].eq(0)
              ? 0
              : balance[0].div("1000000000000000000").toString()}
          </p>
          <p
            style={{
              opacity: isWaitingOnTx || isRefetchingBalance ? 0.25 : 1,
              margin: "5px",
            }}
          >
            Current Receiver Balance:{" "}
            {balance[1].eq(0)
              ? 0
              : balance[1].div("1000000000000000000").toString()}
          </p>
        </div>
      ) : (
        <Spin spinning={true} />
      )}
      <p>Transfer tokens {formValues.value}</p>
      <p>Owner: {formValues.owner}</p>
      <p>Receiver: {formValues.receiver}</p>
      <Button
        loading={isLoading || isPreparingZKTransfer}
        disabled={isError}
        onClick={write}
      >
        Transfer Tokens
      </Button>
      <br />
      <p>*If you like you can now switch to another wallet to use the permit</p>
    </div>
  );
}
