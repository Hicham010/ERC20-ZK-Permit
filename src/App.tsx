import { useAccount, useContractReads } from "wagmi";
import "./App.css";
import Permit from "./Permit";
import { ConnectKitButton } from "connectkit";
import { useState } from "react";
import { Button, Spin, Steps } from "antd";
import { LockOutlined } from "@ant-design/icons";
import Setup from "./Setup";
import { ERC20ZKArtifact } from "./Artifacts/ERC20ZK";
import { constants } from "ethers";
import Confirm from "./Confirm";
import { ERC20ZKPPermitAddress } from "./constants";

function App() {
  const [current, setCurrent] = useState(0);

  const [proof, setProof] = useState();
  const [compoundHash, setCompoundHash] = useState();
  const [formValues, setFormValues] = useState();

  const { address = constants.AddressZero, isConnected } = useAccount();

  const ERC20ZkPermitContract = {
    address: ERC20ZKPPermitAddress,
    abi: ERC20ZKArtifact.abi,
    args: [address],
  } as const;

  const {
    data: [onChainUserHash, balance] = [constants.HashZero, constants.Zero],
  } = useContractReads({
    contracts: [
      { ...ERC20ZkPermitContract, functionName: "userHash" },
      { ...ERC20ZkPermitContract, functionName: "balanceOf" },
    ],
    enabled: isConnected,
    watch: true,
  });

  const setupIsComplete =
    balance.gt("0") && onChainUserHash !== constants.HashZero;

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const steps = [
    {
      title: "Setup",
      content: <Setup />,
    },
    {
      title: "Permit",
      content: (
        <Permit
          setProof={setProof}
          setCompoundHash={setCompoundHash}
          setFormValues={setFormValues}
        />
      ),
    },
    {
      title: "Confirm",
      content: (
        <Confirm
          proof={proof}
          compoundHash={compoundHash}
          formValues={formValues}
        />
      ),
    },
  ];
  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          marginBottom: "30px",
        }}
      >
        <ConnectKitButton theme="soft" />
      </div>

      <>
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
          <div>{steps[current].content}</div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              justifyContent: "space-between",
            }}
          >
            {current > 0 && (
              <Button
                style={{ margin: "0 8px" }}
                onClick={prev}
              >
                Previous
              </Button>
            )}
            {current < steps.length - 1 && (
              <Button
                disabled={
                  !setupIsComplete || (current === 0 ? false : !compoundHash)
                }
                type="primary"
                onClick={next}
              >
                Next
              </Button>
            )}
          </div>
        </Spin>
      </>
    </>
  );
}

export default App;
