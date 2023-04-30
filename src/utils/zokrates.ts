import { initialize } from "zokrates-js";
import { PermitZKArtifact } from "../Artifacts/PermitZKArtifact";

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
