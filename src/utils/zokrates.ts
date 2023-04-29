import { initialize } from "zokrates-js";
import { PermitZKArtifact } from "../Artifacts/PermitZKArtifact";
import { UserHashArtifact } from "../Artifacts/UserHashArtifact";
import { CompoundHashArtifact } from "../Artifacts/CompoundHashArtifact";

export async function getPermitZKProof(
  input: [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ]
) {
  const zokratesProvider = await initialize();
  const art = PermitZKArtifact;

  const program = Uint8Array.from(Buffer.from(art.program, "hex"));
  const output = zokratesProvider.computeWitness(program, input);
  const provingKey = Uint8Array.from(Buffer.from(art.provingKey, "hex"));

  const zokratesProof = zokratesProvider.generateProof(
    program,
    output.witness,
    provingKey
  );

  const isVerified = zokratesProvider.verify(
    art.verificationKey,
    zokratesProof
  );
  console.log(`The proof is verified: ${isVerified}`);

  return { ...zokratesProof, isVerified };
}

export async function getCompoundPoseidonHash(
  input: [string, string, string, string, string, string, string]
) {
  const zokratesProvider = await initialize();

  const art = CompoundHashArtifact;

  const program = Uint8Array.from(Buffer.from(art.program, "hex"));
  const output = zokratesProvider.computeWitness(program, input);

  const provingKey = Uint8Array.from(Buffer.from(art.provingKey, "hex"));

  const zokratesProof = zokratesProvider.generateProof(
    program,
    output.witness,
    provingKey
  );

  const isVerified = zokratesProvider.verify(
    art.verificationKey,
    zokratesProof
  );
  console.log(`The proof is verified: ${isVerified}`);

  return { ...zokratesProof, isVerified };
}

export async function getUserPoseidonHash(input: [string, string, string]) {
  const zokratesProvider = await initialize();

  const art = UserHashArtifact;

  const program = Uint8Array.from(Buffer.from(art.program, "hex"));
  const output = zokratesProvider.computeWitness(program, input);

  const provingKey = Uint8Array.from(Buffer.from(art.provingKey, "hex"));

  const zokratesProof = zokratesProvider.generateProof(
    program,
    output.witness,
    provingKey
  );

  const isVerified = zokratesProvider.verify(
    art.verificationKey,
    zokratesProof
  );
  console.log(`The proof is verified: ${isVerified}`);

  return { ...zokratesProof, isVerified };
}
