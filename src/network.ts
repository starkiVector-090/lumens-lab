import { Horizon, Keypair, Networks } from "@stellar/stellar-sdk";

export interface NetworkConfig {
  horizonUrl: string;
  networkPassphrase: string;
  friendbotUrl?: string;
}

export const TESTNET: NetworkConfig = {
  horizonUrl: "https://horizon-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
  friendbotUrl: "https://friendbot.stellar.org",
};

export const FUTURENET: NetworkConfig = {
  horizonUrl: "https://horizon-futurenet.stellar.org",
  networkPassphrase: Networks.FUTURENET,
  friendbotUrl: "https://friendbot-futurenet.stellar.org",
};

export class TestNetwork {
  readonly server: Horizon.Server;
  readonly config: NetworkConfig;

  constructor(config: NetworkConfig = TESTNET) {
    this.config = config;
    this.server = new Horizon.Server(config.horizonUrl);
  }

  /** Fund a keypair via friendbot and return the funded keypair. */
  async fundAccount(keypair: Keypair = Keypair.random()): Promise<Keypair> {
    if (!this.config.friendbotUrl) {
      throw new Error("No friendbot URL configured for this network");
    }
    const res = await fetch(
      `${this.config.friendbotUrl}?addr=${keypair.publicKey()}`
    );
    if (!res.ok) {
      throw new Error(`Friendbot failed: ${res.status} ${await res.text()}`);
    }
    return keypair;
  }

  /** Load account from Horizon. */
  async loadAccount(publicKey: string) {
    return this.server.loadAccount(publicKey);
  }
}
