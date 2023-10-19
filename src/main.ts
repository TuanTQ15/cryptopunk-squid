import { TypeormDatabase } from "@subsquid/typeorm-store";
import { processor } from "./processor";
import { events as CryptoPunkEvent } from "./abi/cryptopunks";
import { events as WrappedPunkEvent } from "./abi/wrappedpunks";
import { events as ERC72Event } from "./abi/ERC721Sale";
import { events as RaribleEvent } from "./abi/RaribleExchangeV1";
import { events as OpenseaEvent } from "./abi/Opensea";
import {
  Account,
  Ask,
  AskCreated,
  AskRemoved,
  Assign,
  Bid,
  BidCreated,
  BidRemoved,
  CToken,
  Contract,
  EpnsNotificationCounter,
  EpnsPushNotification,
  MetaData,
  Punk,
  Sale,
  Trait,
  Transfer,
  UserProxy,
} from "./model";
import { BlockHeader, Log } from "@subsquid/evm-processor";
import { MappingHandler } from "./handlers";

export const traits = new Map<string, Trait>();
export const punks = new Map<string, Punk>();
export const accounts = new Map<string, Account>();
export const metaDatas = new Map<string, MetaData>();
export const assignEvents = new Map<string, Assign>();
export const punkBidEnteredEvents = new Map<string, Bid>();
export const bidCreatedEvents = new Map<string, BidCreated>();
export const bidRemovedEvents = new Map<string, BidRemoved>();
export const sales = new Map<string, Sale>();
export const asks = new Map<string, Ask>();
export const askRemovedEvents = new Map<string, AskRemoved>();
export const askCreatedEvents = new Map<string, AskCreated>();

export const userProxies = new Map<string, UserProxy>();
export const punkTransfers = new Map<string, Transfer>();

export const ERC721BuyEvents = new Map<string, Assign>();
export const raribleExchangeBuyEvents = new Map<string, Assign>();
export const openseaBuyEvents = new Map<string, Assign>();
export const contracts = new Map<string, Contract>();
export const cTokens = new Map<string, CToken>();

export const epnsNotificationCounters = new Map<
  string,
  EpnsNotificationCounter
>();
export const epnsPushNotifications = new Map<string, EpnsPushNotification>();

async function handleMapping(log: Log, header: BlockHeader, ctx: any) {
  const { timestamp, height, hash: blockHash } = header;
  const txHash = log.transaction?.hash || "";

  if (log.topics[0] === CryptoPunkEvent.Assign.topic) {
    const { punkIndex, to } = CryptoPunkEvent.Assign.decode(log);
    await MappingHandler.handleAssign({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      blockHash,
      punkIndex,
      to,
      address: log.address,
      ctx,
      header,
      logIndex: log.logIndex,
    });
  }

  if (log.topics[0] === CryptoPunkEvent.PunkBidEntered.topic) {
    const { punkIndex, value, fromAddress } =
      CryptoPunkEvent.PunkBidEntered.decode(log);
    MappingHandler.handlePunkBidEntered({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      punkIndex,
      value,
      fromAddress,
      address: log.address,
      logIndex: log.logIndex,
      blockHash,
    });
  }

  if (log.topics[0] === CryptoPunkEvent.PunkBidWithdrawn.topic) {
    const { punkIndex, value, fromAddress } =
      CryptoPunkEvent.PunkBidWithdrawn.decode(log);
    MappingHandler.handlePunkBidWithdrawn({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      punkIndex,
      value,
      fromAddress,
      address: log.address,
      logIndex: log.logIndex,
      blockHash,
    });
  }

  if (log.topics[0] === CryptoPunkEvent.PunkBought.topic) {
    const { punkIndex, value, fromAddress, toAddress } =
      CryptoPunkEvent.PunkBought.decode(log);
    await MappingHandler.handlePunkBought({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      punkIndex,
      value,
      fromAddress,
      address: log.address,
      logIndex: log.logIndex,
      blockHash,
      toAddress,
      header,
      ctx,
    });
  }

  if (log.topics[0] === CryptoPunkEvent.PunkNoLongerForSale.topic) {
    const { punkIndex } = CryptoPunkEvent.PunkNoLongerForSale.decode(log);

    await MappingHandler.handlePunkNoLongerForSale({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      punkIndex,
      address: log.address,
      logIndex: log.logIndex,
      blockHash,
      header,
      ctx,
    });
  }

  if (log.topics[0] === CryptoPunkEvent.PunkOffered.topic) {
    const { punkIndex, minValue, toAddress } =
      CryptoPunkEvent.PunkOffered.decode(log);

    await MappingHandler.handlePunkOffered({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      punkIndex,
      address: log.address,
      logIndex: log.logIndex,
      blockHash,
      header,
      ctx,
      minValue,
      toAddress,
    });
  }

  if (log.topics[0] === CryptoPunkEvent.PunkTransfer.topic) {
    const { punkIndex, from, to } = CryptoPunkEvent.PunkTransfer.decode(log);

    await MappingHandler.handlePunkTransfer({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      punkIndex,
      address: log.address,
      logIndex: log.logIndex,
      blockHash,
      header,
      ctx,
      from,
      to,
    });
  }

  if (log.topics[0] === CryptoPunkEvent.Transfer.topic) {
    const { value, from, to } = CryptoPunkEvent.Transfer.decode(log);

    MappingHandler.handleTransfer({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      value,
      address: log.address,
      logIndex: log.logIndex,
      blockHash,
      from,
      to,
    });
  }
}

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
  for (let c of ctx.blocks) {
    for (let log of c.logs) {
      // decode and normalize the tx data
      await handleMapping(log, c.header, ctx);
    }
  }
  console.log("number of accounts", accounts.size);
});
