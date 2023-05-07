import { BigNumber } from "ethers";
import { Address } from "wagmi";

export interface PermitFormInputs {
  password: string;
  owner: Address;
  receiver: Address;
  value: number;
}

export type Groth16Proof = {
  a: {
    X: BigNumber;
    Y: BigNumber;
  };
  b: {
    X: [BigNumber, BigNumber];
    Y: [BigNumber, BigNumber];
  };
  c: {
    X: BigNumber;
    Y: BigNumber;
  };
};

export type HashType = `0x${string}`;
