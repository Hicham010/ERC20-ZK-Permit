import {
  Address,
  useAccount,
  useContractReads,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { ERC20ZKArtifact } from "./Artifacts/ERC20ZK";
import { Button, Spin, message, notification } from "antd";
import { BigNumber } from "ethers";

export default function Confirm({ proof, compoundHash, formValues }) {
  const MAX_FIELD_VALUE =
    21888242871839275222246405745257275088548364400416034343698204186575808495617n;

  const ERC20ZkPermitContract = {
    address: "0x33db6af053c189e07cc65e5317e7b449fb1bba7e" as Address,
    abi: ERC20ZKArtifact.abi,
  };

  const { address = "0x0", isConnected } = useAccount();
  const {
    data: balance,
    refetch: refetchBalance,
    isRefetching: isRefetchingBalance,
  } = useContractReads({
    contracts: [
      {
        ...ERC20ZkPermitContract,
        functionName: "balanceOf",
        args: [address],
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
    address: "0x33db6af053c189e07cc65e5317e7b449fb1bba7e",
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
