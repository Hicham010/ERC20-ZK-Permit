import { Suspense, lazy, useState } from "react";
import { useAccount, useContractReads } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button, Spin, Steps } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { ERC20ZKArtifact } from "./Artifacts/ERC20ZK";
import { ERC20ZKPPermitAddress, ZERO_ADDRESS, ZERO_HASH } from "./constants";
import { Groth16Proof, HashType, PermitFormInputs } from "./types";

import "./App.css";

const Setup = lazy(() => import("./Setup"));
const Permit = lazy(() => import("./Permit"));
const Confirm = lazy(() => import("./Transfer"));

export default function App() {
  const [current, setCurrent] = useState(0);

  const [proof, setProof] = useState<Groth16Proof | null>(null);
  const [compoundHash, setCompoundHash] = useState<HashType | null>(null);
  const [permitFormInputs, setPermitFormInputs] =
    useState<PermitFormInputs | null>(null);

  const isConfirmReady = proof && compoundHash && permitFormInputs;

  const { address = ZERO_ADDRESS, isConnected } = useAccount();
  const ERC20ZkPermitContract = {
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
    args: [address],
  } as const;

  const { data } = useContractReads({
    contracts: [
      { ...ERC20ZkPermitContract, functionName: "userHash" },
      { ...ERC20ZkPermitContract, functionName: "balanceOf" },
    ],
    enabled: isConnected,
    watch: true,
  });

  let [onChainUserHash, balance] = [ZERO_HASH, 0n];
  if (data && Array.isArray(data) && data[0]?.result && data[1]?.result) {
    [onChainUserHash, balance] = [data[0].result, data[1].result];
  }

  const setupIsComplete = balance > 0n && onChainUserHash !== ZERO_HASH;

  const next = () => setCurrent((prev) => prev + 1);
  const prev = () => setCurrent((prev) => prev - 1);

  const steps = [
    {
      key: 0,
      title: "Setup",
      content: <Setup />,
    },
    {
      key: 1,
      title: "Permit",
      content: (
        <Permit
          setProof={setProof}
          setCompoundHash={setCompoundHash}
          setPermitFormInputs={setPermitFormInputs}
        />
      ),
    },
    {
      key: 2,
      title: "Transfer",
      content: isConfirmReady ? (
        <Confirm
          proof={proof}
          compoundHash={compoundHash}
          permitFormInputs={permitFormInputs}
        />
      ) : (
        <>Error</>
      ),
    },
  ] as const;
  const items = steps.map(({ key, title }) => ({ key, title }));

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          marginBottom: "30px",
        }}
      >
        <ConnectButton
          showBalance={true}
          accountStatus={"full"}
        />
      </div>

      <Spin
        spinning={!isConnected}
        indicator={<LockOutlined />}
        tip="Connect a Wallet"
        size="large"
      >
        <Steps
          style={{ marginBottom: "50px" }}
          current={current}
          items={items}
        />
        <Suspense fallback={<Spin />}>
          <div>{steps[current]?.content ?? "Error: non-existent page"}</div>
        </Suspense>
        <div
          style={{
            display: "flex",
            marginTop: 24,
          }}
        >
          {current > 0 && <Button onClick={prev}>Previous</Button>}
          {current < steps.length - 1 && (
            <Button
              disabled={
                !setupIsComplete || (current === 0 ? false : !compoundHash)
              }
              style={{ marginLeft: "auto" }}
              type="primary"
              onClick={next}
            >
              Next
            </Button>
          )}
        </div>
      </Spin>
    </>
  );
}
