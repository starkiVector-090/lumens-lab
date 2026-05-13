import {
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { TestNetwork, TESTNET } from "../../src/network";

const net = new TestNetwork(TESTNET);

describe("Payment scenario", () => {
  let sender: Keypair;
  let receiver: Keypair;

  beforeAll(async () => {
    [sender, receiver] = await Promise.all([
      net.fundAccount(),
      net.fundAccount(),
    ]);
  }, 30_000);

  it("sends XLM from sender to receiver", async () => {
    const account = await net.loadAccount(sender.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: net.config.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: receiver.publicKey(),
          asset: Asset.native(),
          amount: "10",
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(sender);
    const result = await net.server.submitTransaction(tx);
    expect(result.successful).toBe(true);
  }, 30_000);
});
