import {
  useAccount,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ERC20ZKArtifact } from "./Artifacts/ERC20ZK";
import { Button, Descriptions, Spin, message, notification } from "antd";
import { BigNumber, constants } from "ethers";
import { ERC20ZKPPermitAddress, MAX_FIELD_VALUE } from "./constants";

export default function Confirm({ proof, compoundHash, formValues }) {
  const ERC20ZkPermitContract = {
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
  } as const;

  const { isConnected } = useAccount();
  const {
    data: [ownerBalance, receiverBalance] = [constants.Zero, constants.Zero],
    refetch: refetchBalance,
    isLoading: isLoadingBalances,
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
    staleTime: 4_000,
  });

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
        owner: formValues.owner,
        receiver: formValues.receiver,
        value: BigNumber.from(`${BigInt(formValues.value) * BigInt(1e18)}`),
        deadline: BigNumber.from(`${MAX_FIELD_VALUE - 2n}`),
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
  const { data, isLoading, write } = useContractWrite({
    ...config,
    onSuccess: ({ hash }) => {
      openNotificationWithIcon(hash);
    },
  });

  const { isLoading: isWaitingOnTx } = useWaitForTransaction({
    hash: data?.hash,
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
          <p>{formValues.value} tokens transferring</p>
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
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Descriptions
          title="Transfer Request"
          layout="vertical"
          column={2}
          style={{ width: "75%" }}
        >
          <Descriptions.Item label="Owner Address">
            {formValues.owner}
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
              ownerBalance.div(`${1e18}`).toString()
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Receiver Address">
            {formValues.receiver}
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
              receiverBalance.div(`${1e18}`).toString()
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
        Transfer {formValues.value} Token(s)
      </Button>
      <br />
      <p>*If you like you can now switch to another wallet to use the permit</p>
    </div>
  );
}
