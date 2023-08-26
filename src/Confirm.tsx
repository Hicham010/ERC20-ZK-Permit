import {
  useAccount,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ERC20ZKArtifact } from "./Artifacts/ERC20ZK";
import { Button, Descriptions, Spin, message, notification } from "antd";
import { ERC20ZKPPermitAddress, MAX_FIELD_VALUE } from "./constants";
import { Groth16Proof, HashType, PermitFormInputs } from "./types";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";

type PermitCompValues = {
  proof: Groth16Proof;
  compoundHash: HashType;
  permitFormInputs: PermitFormInputs;
};

export default function Confirm({
  proof,
  compoundHash,
  permitFormInputs,
}: PermitCompValues) {
  const ERC20ZkPermitContract = {
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
  } as const;

  console.log({
    proof,
    compoundHash,
    permitFormInputs,
  });

  const addTransaction = useAddRecentTransaction();

  const { isConnected } = useAccount();
  const {
    data,
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

  let [ownerBalance, receiverBalance] = [0n, 0n];
  if (data && Array.isArray(data) && data[0]?.result && data[1]?.result) {
    [ownerBalance, receiverBalance] = [data[0].result, data[1].result];
  }

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
        deadline: BigInt(MAX_FIELD_VALUE) - 2n,
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
        Transfer {permitFormInputs.value} Token(s)
      </Button>
      <br />
      <p>*If you like you can now switch to another wallet to use the permit</p>
    </div>
  );
}
