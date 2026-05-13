import {
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { TestNetwork, TESTNET } from "../../src/network";
import { withRetry } from "../../src/utils";

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
    await withRetry(() => net.server.submitTransaction(tx));
  }, 30_000);

  it("places a buy offer (XLM → USDC)", async () => {
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
    const result = await withRetry(() => net.server.submitTransaction(tx));
    expect(result.successful).toBe(true);
  }, 30_000);

  it("places a sell offer (USDC → XLM)", async () => {
    const account = await net.loadAccount(trader.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: net.config.networkPassphrase,
    })
      .addOperation(
        Operation.manageSellOffer({
          selling: USDC,
          buying: Asset.native(),
          amount: "0",   // 0 = cancel/no-op if no balance; valid for scaffold
          price: "10",
        })
      )
      .setTimeout(30)
      .build();
    tx.sign(trader);
    const result = await withRetry(() => net.server.submitTransaction(tx));
    expect(result.successful).toBe(true);
  }, 30_000);

  it("executes a path payment strict send (XLM → XLM via empty path)", async () => {
    const account = await net.loadAccount(trader.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: net.config.networkPassphrase,
    })
      .addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset: Asset.native(),
          sendAmount: "1",
          destination: trader.publicKey(),
          destAsset: Asset.native(),
          destMin: "1",
          path: [],
        })
      )
      .setTimeout(30)
      .build();
    tx.sign(trader);
    const result = await withRetry(() => net.server.submitTransaction(tx));
    expect(result.successful).toBe(true);
  }, 30_000);
});
