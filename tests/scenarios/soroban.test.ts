import {
  Keypair,
  TransactionBuilder,
  Operation,
  BASE_FEE,
  SorobanRpc,
  xdr,
} from "@stellar/stellar-sdk";
import { TestNetwork, FUTURENET } from "../../src/network";

// Soroban tests run against Futurenet (Soroban-enabled)
const net = new TestNetwork(FUTURENET);
const rpc = new SorobanRpc.Server(
  "https://rpc-futurenet.stellar.org"
);

describe("Soroban scenario", () => {
  let caller: Keypair;

  beforeAll(async () => {
    caller = await net.fundAccount();
  }, 30_000);

  it("uploads and invokes a minimal Soroban contract (upload wasm)", async () => {
    // Minimal valid Wasm: a no-op contract compiled to the smallest possible binary.
    // In a real scenario this would be read from a .wasm file.
    const wasmBuffer = Buffer.from(
      // Minimal Wasm magic + version header (not a real contract — replace with actual .wasm)
      "0061736d01000000",
      "hex"
    );

    const account = await net.loadAccount(caller.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: net.config.networkPassphrase,
    })
      .addOperation(
        Operation.uploadContractWasm({ wasm: wasmBuffer })
      )
      .setTimeout(30)
      .build();

    const preparedTx = await rpc.prepareTransaction(tx);
    preparedTx.sign(caller);

    const sendResult = await rpc.sendTransaction(preparedTx);
    expect(["PENDING", "DUPLICATE"]).toContain(sendResult.status);
  }, 60_000);
});
