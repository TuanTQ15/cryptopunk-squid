import { TypeormDatabase } from "@subsquid/typeorm-store";
import { processor } from "./processor";
import { events as CryptoPunkEvent } from "./abi/cryptopunks";
import { events as WrappedPunkEvent } from "./abi/wrappedpunks";
import { events as ERC721Event } from "./abi/ERC721Sale";
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
  Unwrap,
  UserProxy,
  Wrap,
} from "./model";
import { BlockHeader, Log } from "@subsquid/evm-processor";
import { MappingHandler, MarketplaceHandler } from "./handlers";

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
export const contracts = new Map<string, Contract>();
export const cTokens = new Map<string, CToken>();
export const wraps = new Map<string, Wrap>();
export const unWraps = new Map<string, Unwrap>();
export const epnsPushNotifications = new Map<string, EpnsPushNotification>();
export const epnsNotificationCounters = new Map<
  string,
  EpnsNotificationCounter
>();

async function handleCryptoPunk(log: Log, header: BlockHeader, ctx: any) {
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

async function handleWrappedPunk(log: Log, header: BlockHeader, ctx: any) {
  const { timestamp, height, hash: blockHash } = header;
  const txHash = log.transaction?.hash || "";

  if (log.topics[0] === WrappedPunkEvent.Transfer.topic) {
    const { from, to, tokenId } = WrappedPunkEvent.Transfer.decode(log);
    await MappingHandler.handleWrappedPunkTransfer({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      blockHash,
      tokenId,
      from,
      to,
      address: log.address,
      ctx,
      header,
      logIndex: log.logIndex,
    });
  }

  if (log.topics[0] === WrappedPunkEvent.ProxyRegistered.topic) {
    const { user, proxy } = WrappedPunkEvent.ProxyRegistered.decode(log);
    MappingHandler.handleProxyRegistered({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      blockHash,
      address: log.address,
      logIndex: log.logIndex,
      user,
      proxy,
    });
  }
}

async function handleMarketplace(log: Log, header: BlockHeader, ctx: any) {
  const { timestamp, height, hash: blockHash } = header;
  const txHash = log.transaction?.hash || "";

  if (log.topics[0] === ERC721Event.Buy.topic) {
    const { tokenId, seller, buyer, price } = ERC721Event.Buy.decode(log);

    await MarketplaceHandler.handleERC721Buy({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      blockHash,
      tokenId,
      address: log.address,
      ctx,
      header,
      logIndex: log.logIndex,
      seller,
      buyer,
      price,
    });
  }

  if (log.topics[0] === RaribleEvent.Buy.topic) {
    const { owner, buyer, buyTokenId, sellTokenId, buyValue } =
      RaribleEvent.Buy.decode(log);

    await MarketplaceHandler.handleExchangeV1Buy({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      blockHash,
      owner,
      address: log.address,
      ctx,
      header,
      logIndex: log.logIndex,
      buyTokenId,
      buyer,
      sellTokenId,
      buyValue,
    });
  }

  if (log.topics[0] === OpenseaEvent.OrdersMatched.topic) {
    const { maker, taker, price } = OpenseaEvent.OrdersMatched.decode(log);

    await MarketplaceHandler.handleOpenSeaSale({
      timestamp: BigInt(timestamp),
      blockNumber: BigInt(height),
      txHash,
      blockHash,
      maker,
      address: log.address,
      ctx,
      header,
      logIndex: log.logIndex,
      taker,
      price,
    });
  }
}
processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
  for (let c of ctx.blocks) {
    for (let log of c.logs) {
      // decode and normalize the tx data

      await handleWrappedPunk(log, c.header, ctx);
      await handleCryptoPunk(log, c.header, ctx);
    }
  }
});
