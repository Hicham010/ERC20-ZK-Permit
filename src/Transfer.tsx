import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { Button, Descriptions, Spin, message, notification } from "antd";
import type { Hash } from "viem";
import {
  useAccount,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ERC20ZkPermitContract, MAX_FIELD_VALUE } from "./constants";
import type { Groth16Proof, PermitFormInputs } from "./types";

type PermitCompValues = {
  proof: Groth16Proof;
  compoundHash: Hash;
  permitFormInputs: PermitFormInputs;
};

export default function Confirm({
  proof,
  compoundHash,
  permitFormInputs,
}: PermitCompValues) {
  console.log({
    proof,
    compoundHash,
    permitFormInputs,
  });

  const addTransaction = useAddRecentTransaction();

  const { isConnected } = useAccount();
  const {
    data = [],
    refetch: refetchBalance,
    isLoading: isLoadingBalances,
    isRefetching: isRefetchingBalance,
  } = useContractReads({
    contracts: [
      {
        ...ERC20ZkPermitContract,
        functionName: "balanceOf",
        args: [permitFormInputs.owner],
      },
      {
        ...ERC20ZkPermitContract,
        functionName: "balanceOf",
        args: [permitFormInputs.receiver],
      },
    ],
    enabled: isConnected,
    watch: true,
  });

  const ownerBalance = data[0]?.result ?? 0n;
  const receiverBalance = data[1]?.result ?? 0n;

  const {
    config,
    isError,
    isLoading: isPreparingZKTransfer,
  } = usePrepareContractWrite({
    ...ERC20ZkPermitContract,
    functionName: "zkTransferFrom",
    args: [
      proof,
      {
        owner: permitFormInputs.owner,
        receiver: permitFormInputs.receiver,
        value: BigInt(permitFormInputs.value) * BigInt(1e18),
        deadline: MAX_FIELD_VALUE - 2n,
      },
      compoundHash,
    ],
    enabled: isConnected,
    onError(err) {
      if ("reason" in err) {
        message.error("Something went wrong: " + err.reason);
      } else {
        message.error("Something went wrong: " + err.message);
      }
    },
  });
  const {
    data: dataWrite,
    isLoading,
    isSuccess,
    write,
  } = useContractWrite({
    ...config,
    onSuccess: ({ hash }) => {
      openNotificationWithIcon(hash);
      addTransaction({ hash, description: "Transferred tokens" });
    },
  });

  const { isLoading: isWaitingOnTx } = useWaitForTransaction({
    hash: dataWrite?.hash,
    onSuccess() {
      message.success("The transfer is complete");
      refetchBalance();
    },
    onError() {
      message.error("The transfer failed");
    },
  });

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (transactionHash: string) => {
    api["info"]({
      message: "Transfer Pending",
      description: (
        <>
          <p>{permitFormInputs.value} tokens transferring</p>
          <p>From: {permitFormInputs.owner}</p>
          <p>to: {permitFormInputs.receiver}</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Transaction Link
          </a>
        </>
      ),
    });
  };

  return (
    <>
      {contextHolder}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Descriptions
          title="Transfer Request"
          layout="vertical"
          column={2}
          style={{ width: "75%" }}
        >
          <Descriptions.Item label="Owner Address">
            {permitFormInputs.owner}
          </Descriptions.Item>
          <Descriptions.Item
            label="Owner Balance"
            style={{
              opacity: isWaitingOnTx || isRefetchingBalance ? 0.25 : 1,
              margin: "5px",
            }}
          >
            {isLoadingBalances ? (
              <Spin />
            ) : (
              (ownerBalance / BigInt(1e18)).toString()
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Receiver Address">
            {permitFormInputs.receiver}
          </Descriptions.Item>
          <Descriptions.Item
            label="Receiver Balance"
            style={{
              opacity: isWaitingOnTx || isRefetchingBalance ? 0.25 : 1,
              margin: "5px",
            }}
          >
            {isLoadingBalances ? (
              <Spin />
            ) : (
              (receiverBalance / BigInt(1e18)).toString()
            )}
          </Descriptions.Item>
        </Descriptions>
      </div>
      <Button
        loading={isLoading || isPreparingZKTransfer}
        disabled={isError}
        onClick={write}
        type="primary"
      >
        Transfer {permitFormInputs.value} token(s)
      </Button>
      <br />
      <p>*If you like you can now switch to another wallet to use the permit</p>
      {isSuccess ? (
        <p>
          The{" "}
          <a
            href={`https://sepolia.etherscan.io/tx/${dataWrite?.hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            transaction
          </a>{" "}
          is succesfully send 🎉🎉🎉
        </p>
      ) : null}
    </>
  );
}
