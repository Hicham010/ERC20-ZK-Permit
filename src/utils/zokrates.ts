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
  const { PermitZKArtifact } = await import("../Artifacts/PermitZKArtifact");
  const { initialize } = await import("zokrates-js");

  const zokratesProvider = await initialize();
  const { program, provingKey, verificationKey } = PermitZKArtifact;

  const programHex = Uint8Array.from(Buffer.from(program, "hex"));
  const output = zokratesProvider.computeWitness(programHex, input);
  const provingKeyHex = Uint8Array.from(Buffer.from(provingKey, "hex"));

  const zokratesProof = zokratesProvider.generateProof(
    programHex,
    output.witness,
    provingKeyHex
  );

  const isVerified = zokratesProvider.verify(verificationKey, zokratesProof);
  console.log(`The proof is verified: ${isVerified}`);

  return { ...zokratesProof, isVerified };
}
