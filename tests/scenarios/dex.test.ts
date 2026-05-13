import {
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { TestNetwork, TESTNET } from "../../src/network";

const net = new TestNetwork(TESTNET);

describe("DEX scenario", () => {
  let trader: Keypair;
  const usdcIssuer = Keypair.random();
  let USDC: Asset;

  beforeAll(async () => {
    trader = await net.fundAccount();
    USDC = new Asset("USDC", usdcIssuer.publicKey());

    // Establish trustline for USDC
    const account = await net.loadAccount(trader.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: net.config.networkPassphrase,
    })
      .addOperation(Operation.changeTrust({ asset: USDC }))
      .setTimeout(30)
      .build();
    tx.sign(trader);
    await net.server.submitTransaction(tx);
  }, 30_000);

  it("places a buy offer on the DEX", async () => {
    const account = await net.loadAccount(trader.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: net.config.networkPassphrase,
    })
      .addOperation(
        Operation.manageBuyOffer({
          selling: Asset.native(),
          buying: USDC,
          buyAmount: "1",
          price: "0.1",
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(trader);
    const result = await net.server.submitTransaction(tx);
    expect(result.successful).toBe(true);
  }, 30_000);
});
