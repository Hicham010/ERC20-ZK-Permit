import { Address } from "wagmi";

export interface PermitFormInputs {
  password: string;
  owner: Address;
  receiver: Address;
  value: number;
}

export type Groth16Proof = {
  a: {
    X: bigint;
    Y: bigint;
  };
  b: {
    X: [bigint, bigint];
    Y: [bigint, bigint];
  };
  c: {
    X: bigint;
    Y: bigint;
  };
};

export type HashType = `0x${string}`;
