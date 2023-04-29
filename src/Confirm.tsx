import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import { ERC20ZKArtifact } from "./Artifacts/ERC20ZK";
import { Button, message, notification } from "antd";
import { BigNumber } from "ethers";

export default function Confirm({ proof, compoundHash, formValues }) {
  const MAX_FIELD_VALUE =
    21888242871839275222246405745257275088548364400416034343698204186575808495617n;

  const { address = "0x0", isConnected } = useAccount();
  const { data: balance } = useContractRead({
    address: "0x33db6af053c189e07cc65e5317e7b449fb1bba7e",
    abi: ERC20ZKArtifact.abi,
    functionName: "balanceOf",
    args: [address],
    watch: true,
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
  const { isLoading, write } = useContractWrite({
    ...config,
    onSuccess: ({ hash }) => {
      openNotificationWithIcon(hash);
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
      <p>
        Current Balance:{" "}
        {balance?.eq(0) ? 0 : balance?.div("1000000000000000000").toString()}
      </p>
      <p>Transfer tokens {formValues.value}</p>
      <p>from: {formValues.owner}</p>
      <p>to: {formValues.receiver}</p>
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
