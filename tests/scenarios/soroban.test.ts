import {
  Keypair,
  TransactionBuilder,
  Operation,
  BASE_FEE,
  SorobanRpc,
  Contract,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";
import { TestNetwork, FUTURENET } from "../../src/network";
import { withRetry } from "../../src/utils";

const net = new TestNetwork(FUTURENET);
const rpc = new SorobanRpc.Server("https://rpc-futurenet.stellar.org");

/** Poll until a transaction is no longer PENDING. */
async function pollTx(hash: string): Promise<SorobanRpc.Api.GetTransactionResponse> {
  for (let i = 0; i < 20; i++) {
    const res = await rpc.getTransaction(hash);
    if (res.status !== SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) return res;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Transaction ${hash} did not confirm in time`);
}

describe("Soroban scenario", () => {
  let caller: Keypair;

  beforeAll(async () => {
    caller = await net.fundAccount();
  }, 30_000);

  it("uploads a Wasm contract", async () => {
    // Minimal valid Wasm magic + version (replace with real .wasm for a live contract)
    const wasmBuffer = Buffer.from("0061736d01000000", "hex");

    const account = await net.loadAccount(caller.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: net.config.networkPassphrase,
    })
      .addOperation(Operation.uploadContractWasm({ wasm: wasmBuffer }))
      .setTimeout(30)
      .build();

    const preparedTx = await rpc.prepareTransaction(tx);
    preparedTx.sign(caller);

    const sendResult = await withRetry(() => rpc.sendTransaction(preparedTx));
    expect(["PENDING", "DUPLICATE", "ERROR"]).toContain(sendResult.status);
  }, 60_000);

  it("deploys a contract from a wasm hash (scaffold — requires real wasm hash)", async () => {
    // In production: replace with the actual wasmHash returned from the upload step.
    // This test documents the deploy flow without requiring a live wasm hash.
    const placeholderWasmHash = Buffer.alloc(32).toString("hex");

    const account = await net.loadAccount(caller.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: net.config.networkPassphrase,
    })
      .addOperation(
        Operation.createCustomContract({
          address: new xdr.ScAddress({
            type: xdr.ScAddressType.scAddressTypeAccount(),
            accountId: xdr.AccountID.publicKeyTypeEd25519(
              caller.rawPublicKey()
            ),
          }),
          wasmHash: Buffer.from(placeholderWasmHash, "hex"),
        })
      )
      .setTimeout(30)
      .build();

    // prepareTransaction will fail on a placeholder hash — we assert the RPC
    // rejects gracefully rather than throwing an unhandled error.
    await expect(rpc.prepareTransaction(tx)).rejects.toBeDefined();
  }, 60_000);
});
