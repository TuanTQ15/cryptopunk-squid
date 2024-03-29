import {
  getOrCreateAccount,
  updateAccountAggregates,
  updateAccountHoldings,
} from "../helpers/account.helper";
import { MappingInterface } from "../interfaces";
import { Trait, TraitMetaData, TraitType, UserProxy } from "../model";
import { createMetadata } from "../helpers/metadata.helper";
import {
  createPunk,
  updatePunkOwner,
  updatePunkSaleAggregates,
} from "../helpers/punk.helper";
import {
  getOrCreateCryptoPunkContract,
  getOrCreateWrappedPunkContract,
  updateContractAggregates,
} from "../helpers/contract.helper";
import { getOrCreateAssign } from "../helpers/assign.helper";
import {
  traits as traitMaps,
  accounts,
  metaDatas,
  assignEvents,
  contracts,
  punks,
  punkBidEnteredEvents,
  bidCreatedEvents,
  bidRemovedEvents,
  sales,
  asks,
  askRemovedEvents,
  askCreatedEvents,
  userProxies,
  punkTransfers,
  cTokens,
  wraps,
  unWraps,
} from "../main";
import { getTrait } from "../traits";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  WRAPPED_PUNK_ADDRESS,
  ZERO_ADDRESS,
} from "../constant";
import {
  closeOldBid,
  createBidCreated,
  createBidRemoved,
  getOrCreateBid,
  handleBidNotification,
} from "../helpers/bid.helper";
import {
  getOrCreateCToken,
  getOwnerFromCToken,
  hexStringToUint8Array,
} from "../utils";
import {
  getOrCreateSale,
  handleSaleNotification,
} from "../helpers/sale.helper";
import {
  closeOldAsk,
  createAskCreated,
  createAskRemoved,
  getOrCreateAsk,
  handleAskNotification,
} from "../helpers/ask.helper";
import { getOrCreateTransfer } from "../helpers/transfer.helper";
import { createUnwrap, createWrap } from "../helpers/wrapAndUnwrap.helper";

export async function handleAssign(
  data: MappingInterface.IAssign
): Promise<void> {
  const { punkIndex: tokenId, to, address, ctx, header } = data;
  const trait = getTrait(tokenId);
  const account = getOrCreateAccount(to);
  const contract = await getOrCreateCryptoPunkContract(ctx, header, address);

  //Assign is always the first EVENTS that actually creates the punk
  const punk = createPunk(tokenId, account);

  const metadata = createMetadata(punk, metaDatas);
  const assign = getOrCreateAssign(data, account, punk, metadata, contract);

  if (trait) {
    const traits = new Array<TraitMetaData>();
    let type = traitMaps.get(trait.type);
    if (!type) {
      type = new Trait({
        id: trait.type,
      });
      type.type = TraitType.TYPE;
      type.numberOfNfts = BIGINT_ZERO;
    }

    type.numberOfNfts = type.numberOfNfts + BIGINT_ONE;
    traitMaps.set(type.id, type);
    const traitMetaData = new TraitMetaData({
      trait: type,
      metadata,
    });
    traits.push(traitMetaData);

    for (let i = 0; i < trait.accessories.length; i++) {
      const accessoryName = trait.accessories[i];
      const acessoryId = accessoryName.split(" ").join("-");
      let accessory = traitMaps.get(acessoryId);

      if (!accessory) {
        accessory = new Trait({
          id: acessoryId,
        });
        accessory.type = TraitType.ACCESSORY;
        accessory.numberOfNfts = BIGINT_ZERO;
      }
      accessory.numberOfNfts = accessory.numberOfNfts + BIGINT_ONE;
      traitMaps.set(accessory.id, accessory);
      const traitMetaData = new TraitMetaData({
        trait: accessory,
        metadata,
      });
      traits.push(traitMetaData);
    }

    metadata.traits = traits;
  }

  //Update account punk holdings
  account.numberOfPunksOwned = account.numberOfPunksOwned + BIGINT_ONE;
  account.numberOfPunksAssigned = account.numberOfPunksAssigned + BIGINT_ONE;

  //Write
  accounts.set(account.id, account);
  assignEvents.set(assign.id, assign);
  contracts.set(contract.id, contract);
  metaDatas.set(metadata.id, metadata);
  punks.set(punk.id, punk);
}

export function handleTransfer(data: MappingInterface.ITransfer): void {
  const {
    from,
    to,
    value,
    txHash,
    blockHash,
    blockNumber,
    logIndex,
    timestamp,
  } = data;
  if (to != ZERO_ADDRESS) {
    const fromAccount = getOrCreateAccount(from);
    const toAccount = getOrCreateAccount(to);
    const cToken = getOrCreateCToken(
      txHash,
      logIndex,
      blockNumber,
      blockHash,
      timestamp
    );

    cToken.from = fromAccount;
    cToken.to = toAccount;
    cToken.owner = toAccount.id;
    cToken.amount = value;

    cTokens.set(cToken.id, cToken);
    accounts.set(toAccount.id, toAccount);
    accounts.set(fromAccount.id, fromAccount);
  }
}

export async function handlePunkTransfer(
  data: MappingInterface.IPunkTransfer
): Promise<void> {
  const {
    from,
    to,
    punkIndex,
    txHash,
    timestamp,
    blockHash,
    blockNumber,
    logIndex,
    ctx,
    header,
    address,
  } = data;

  const sender = from;
  const receiver = to;
  const tokenId = punkIndex.toString();

  const fromProxy = userProxies.get(sender)!;
  const toProxy = userProxies.get(receiver)!;

  if (toProxy) {
    return;
  } else if (
    receiver != WRAPPED_PUNK_ADDRESS &&
    sender != WRAPPED_PUNK_ADDRESS
  ) {
    const toAccount = getOrCreateAccount(to);
    const fromAccount = getOrCreateAccount(from);
    const punk = punks.get(tokenId)!;
    const contract = await getOrCreateCryptoPunkContract(ctx, header, address);

    punk.numberOfTransfers = punk.numberOfTransfers + BIGINT_ONE;

    const transfer = getOrCreateTransfer(
      punk,
      contract,
      txHash,
      logIndex,
      timestamp,
      blockHash,
      blockNumber
    );
    transfer.from = fromAccount;
    transfer.to = toAccount;

    //We close the oldBid if the bidder was transfered the punk
    const oldBid = punk.currentBid;
    if (oldBid) {
      if (oldBid.from.id == toAccount.id) {
        oldBid.created = punk.currentBidCreated;
        oldBid.open = false;

        punkBidEnteredEvents.set(oldBid.id, oldBid);
      }
    }
    updateAccountHoldings(toAccount, fromAccount);
    toAccount.numberOfTransfers = toAccount.numberOfTransfers + BIGINT_ONE;
    fromAccount.numberOfTransfers = fromAccount.numberOfTransfers + BIGINT_ONE;

    //Capture punk transfers and owners if not transfered to WRAPPED PUNK ADDRESS
    punk.owner = toAccount;

    //Write
    punkTransfers.set(transfer.id, transfer);
    accounts.set(toAccount.id, toAccount);
    accounts.set(fromAccount.id, fromAccount);
    punks.set(punk.id, punk);
  } else if (
    fromProxy &&
    sender == fromProxy.id &&
    receiver == WRAPPED_PUNK_ADDRESS
  ) {
    const punk = punks.get(tokenId)!;
    punk.wrapped = true;

    //Write
    punks.set(punk.id, punk);
  } else if (sender == WRAPPED_PUNK_ADDRESS) {
    //Burn/Unwrap

    const punk = punks.get(tokenId)!;
    punk.wrapped = false;

    //Write
    punks.set(punk.id, punk);
  }
}

export async function handlePunkOffered(
  data: MappingInterface.IPunkOffered
): Promise<void> {
  const {
    punkIndex,
    minValue,
    toAddress,
    ctx,
    header,
    address,
    blockHash,
    txHash,
    logIndex,
    blockNumber,
    timestamp,
  } = data;

  const punk = punks.get(punkIndex.toString())!;
  const contract = await getOrCreateCryptoPunkContract(ctx, header, address);
  const askCreated = createAskCreated(
    punk,
    contract,
    blockHash,
    txHash,
    logIndex,
    timestamp,
    blockNumber
  );

  const fromAccount = getOrCreateAccount(punk.owner.id);
  const toAccount = getOrCreateAccount(toAddress);
  closeOldAsk(punk, fromAccount);

  const ask = getOrCreateAsk(fromAccount, txHash, logIndex);

  ask.nft = punk;
  ask.from = punk.owner;
  ask.amount = minValue;
  ask.created = askCreated;
  ask.open = true;

  askCreated.ask = ask;
  askCreated.to = toAccount;
  askCreated.from = punk.owner;
  askCreated.amount = minValue;

  punk.currentAskCreated = askCreated;

  //Update the currentAsk for the punk in Punk entity for future reference
  punk.currentAsk = ask;

  //Write
  askCreatedEvents.set(askCreated.id, askCreated);
  punks.set(punk.id, punk);
  asks.set(ask.id, ask);

  //Remove before deploying to The Graph Network
  if (blockNumber > 15205322) {
    handleAskNotification(punk.id, punk.owner.id, minValue.toString(), txHash);
  }
}

export function handlePunkBidEntered(
  data: MappingInterface.IPunkBidEntered
): void {
  const { punkIndex, value, fromAddress, address, blockNumber } = data;

  const punk = punks.get(punkIndex.toString())!;
  const contract = contracts.get(address)!;

  const account = getOrCreateAccount(fromAddress);
  const bid = getOrCreateBid(data, account);
  const bidCreated = createBidCreated(data, punk, account, contract);
  bid.amount = value;
  bid.created = bidCreated;

  punk.currentBid = bid;

  bidCreated.bid = bid; //Create relationship with Bid
  bidCreated.amount = value;

  //Update the currentBid for the punk in Punk entity for future reference
  punk.currentBidCreated = bidCreated;

  //Write
  punkBidEnteredEvents.set(bid.id, bid);
  punks.set(punk.id, punk);
  accounts.set(account.id, account);
  contracts.set(contract.id, contract);
  bidCreatedEvents.set(bidCreated.id, bidCreated);

  //Remove before deploying to The Graph Network
  if (blockNumber > BigInt(15205322)) {
    handleBidNotification(punk.id, account.id, value.toString(), data);
  }
}
export function handlePunkBidWithdrawn(
  data: MappingInterface.IPunkBidWithdrawn
): void {
  /**
    	@summary: The event fires anytime a bidder withdraws their bid
		@description:
			- createBidRemovedEVENT
			- close Old Bid
			- create relationship between Bid and BidRemoved
 	 */

  const { punkIndex, value, fromAddress, address } = data;

  const punk = punks.get(punkIndex.toString())!;
  const contract = contracts.get(address)!;

  const account = getOrCreateAccount(fromAddress);
  const bidRemoved = createBidRemoved(data, punk, account, contract);
  bidRemoved.amount = value;

  const oldBid = punk.currentBid;
  if (oldBid) {
    oldBid.created = punk.currentBidCreated;
    oldBid.from = account;
    oldBid.open = false;
    oldBid.removed = bidRemoved;

    bidRemoved.bid = oldBid;

    punkBidEnteredEvents.set(oldBid.id, oldBid);
  }
  //Update Punk fields with current bid removal EVENT so we can reference them elsewhere
  punk.currentBidRemoved = bidRemoved;

  //Write

  punks.set(punk.id, punk);

  accounts.set(account.id, account);
  bidRemovedEvents.set(bidRemoved.id, bidRemoved);
}

export async function handlePunkNoLongerForSale(
  data: MappingInterface.IPunkNoLongerForSale
): Promise<void> {
  const {
    punkIndex,
    ctx,
    header,
    address,
    logIndex,
    blockHash,
    txHash,
    timestamp,
    blockNumber,
  } = data;
  const punk = punks.get(punkIndex.toString())!;
  const contract = await getOrCreateCryptoPunkContract(ctx, header, address);
  const askRemoved = createAskRemoved(
    punk,
    contract,
    logIndex,
    blockHash,
    timestamp,
    txHash,
    blockNumber
  );

  //Close Old Ask
  const oldAsk = punk.currentAsk;
  if (oldAsk) {
    //Create relationship with AskRemoved
    oldAsk.removed = askRemoved;
    oldAsk.created = punk.currentAskCreated;
    oldAsk.nft = punk;
    oldAsk.open = false;
    oldAsk.from = punk.owner;
    askRemoved.ask = oldAsk;

    asks.set(oldAsk.id, oldAsk);
  } else {
    //https://cryptopunks.app/cryptopunks/details/2158
    //This is a weird case where an offer can be withdrawn before it's created

    const ask = getOrCreateAsk(punk.owner, txHash, logIndex);
    ask.nft = punk;
    ask.open = false;
    ask.from = punk.owner;
    ask.removed = askRemoved;

    //Amount is 0 because this field is non-nullable & this basically initializes the field so it doesn't fail.
    //Also, this event doesn't emit the amount.

    ask.amount = BIGINT_ZERO;
    askRemoved.amount = BIGINT_ZERO;
    askRemoved.ask = ask;

    asks.set(ask.id, ask);
  }

  punk.currentAskRemoved = askRemoved;

  //Write
  askRemovedEvents.set(askRemoved.id, askRemoved);
  punks.set(punk.id, punk);
}

export async function handlePunkBought(
  data: MappingInterface.IPunkBought
): Promise<void> {
  const {
    punkIndex,
    value,
    fromAddress,
    address,
    toAddress,
    ctx,
    header,
    logIndex,
    txHash,
    blockHash,
    timestamp,
    blockNumber,
  } = data;
  if (toAddress == ZERO_ADDRESS) {
    const tokenId = punkIndex;
    const punk = punks.get(punkIndex.toString())!;
    const contract = await getOrCreateCryptoPunkContract(ctx, header, address);
    const fromAccount = getOrCreateAccount(fromAddress);
    const addressOwner = getOwnerFromCToken(
      logIndex,
      txHash,
      blockNumber,
      blockHash,
      timestamp
    );
    const toAccount = getOrCreateAccount(addressOwner);
    const bidRemoved = createBidRemoved(data, punk, fromAccount, contract);
    const sale = getOrCreateSale(
      fromAccount,
      punk,
      logIndex,
      txHash,
      contract,
      timestamp,
      blockNumber,
      blockHash
    );

    closeOldAsk(punk, fromAccount);

    //Close old bid if the bidder is the buyer & use the bid amount to update sale
    const oldBid = punk.currentBid;
    if (oldBid) {
      if (oldBid.from.id == toAccount.id) {
        oldBid.created = punk.currentBidCreated;
        oldBid.removed = bidRemoved;
        oldBid.nft = punk;
        bidRemoved.bid = oldBid;
        oldBid.open = false;

        punkBidEnteredEvents.set(oldBid.id, oldBid);
      }

      sale.amount = oldBid.amount;
      sale.to = toAccount;
      updateAccountAggregates(fromAccount, toAccount, oldBid.amount);
      updatePunkSaleAggregates(punk, oldBid.amount);
      updateContractAggregates(contract, oldBid.amount);

      if (blockNumber > 15205322) {
        handleSaleNotification(
          punk.id,
          toAccount.id,
          oldBid.amount.toString(),
          txHash
        );
      }
    }

    updatePunkOwner(punk, toAccount);
    updateAccountHoldings(toAccount, fromAccount);

    //Save the current BidRemoved for future reference
    punk.currentBidRemoved = bidRemoved;

    //Write

    contracts.set(contract.id, contract);

    punks.set(punk.id, punk);

    sales.set(sale.id, sale);

    bidRemovedEvents.set(bidRemoved.id, bidRemoved);

    accounts.set(toAccount.id, toAccount);

    accounts.set(fromAccount.id, fromAccount);
  } else {
    const price = value;
    const tokenId = punkIndex.toString();
    const seller = fromAddress;
    const buyer = toAddress;

    const punk = punks.get(tokenId)!;
    const contract = await getOrCreateCryptoPunkContract(ctx, header, address);
    const toAccount = getOrCreateAccount(buyer);
    const fromAccount = getOrCreateAccount(seller);
    const sale = getOrCreateSale(
      fromAccount,
      punk,
      logIndex,
      txHash,
      contract,
      timestamp,
      blockNumber,
      blockHash
    );

    sale.amount = price;
    sale.to = toAccount;

    closeOldBid(punk, toAccount);
    closeOldAsk(punk, fromAccount);
    updatePunkOwner(punk, toAccount);
    updatePunkSaleAggregates(punk, price);
    updateContractAggregates(contract, price);
    updateAccountHoldings(toAccount, fromAccount);
    updateAccountAggregates(fromAccount, toAccount, price);

    //Write

    punks.set(punk.id, punk);
    accounts.set(fromAccount.id, fromAccount);
    accounts.set(toAccount.id, toAccount);
    contracts.set(contract.id, contract);
    sales.set(sale.id, sale);

    //Remove before deploying to The Graph Network
    if (blockNumber > 15205322) {
      handleSaleNotification(punk.id, buyer, price.toString(), txHash);
    }
  }
}

// //This function is called for three events: Mint (Wrap), Burn (Unwrap) and Transfer
export async function handleWrappedPunkTransfer(
  data: MappingInterface.IWrappedPunkTransfer
): Promise<void> {
  const {
    ctx,
    header,
    address,
    from,
    to,
    tokenId,
    txHash,
    blockHash,
    blockNumber,
    timestamp,
    logIndex,
  } = data;
  const contract = await getOrCreateWrappedPunkContract(ctx, header, address);

  const fromAccount = getOrCreateAccount(from)!;
  const toAccount = getOrCreateAccount(to)!;
  const punk = punks.get(tokenId.toString())!;
  if (from == ZERO_ADDRESS) {
    // A wrapped punk is minted (wrapped)
    const wrap = createWrap(
      WRAPPED_PUNK_ADDRESS,
      fromAccount,
      punk,
      txHash,
      logIndex,
      blockNumber,
      blockHash,
      timestamp
    );

    contract.totalSupply = contract.totalSupply + BIGINT_ONE;

    wrap.to = toAccount;

    //Write
    wraps.set(wrap.id, wrap);
  } else if (to == ZERO_ADDRESS) {
    // A wrapped punk is burned (unwrapped)
    const unWrap = createUnwrap(
      fromAccount,
      toAccount,
      punk,
      txHash,
      logIndex,
      blockNumber,
      blockHash,
      timestamp
    );

    contract.totalSupply = contract.totalSupply - BIGINT_ONE;

    //Write
    unWraps.set(unWrap.id, unWrap);
  } else {
    //Wrapped Punk Transfer
    //We do not want to save a transfer for wrapped punk mints/burns

    let transfer = getOrCreateTransfer(
      punk,
      contract,
      txHash,
      logIndex,
      timestamp,
      blockHash,
      blockNumber
    );

    //We create a cToken Entity here to store IDs for future comparison
    const cToken = getOrCreateCToken(
      txHash,
      logIndex,
      blockNumber,
      blockHash,
      timestamp
    );
    cToken.from = fromAccount;
    cToken.to = toAccount;
    cToken.owner = to;
    cToken.punkId = tokenId.toString();

    //We need the contract address to filter our transactions from other marketplace(OpenSea,RaribleExchangeV1, ERC721Sale) sales
    cToken.referenceId = address;

    transfer.from = fromAccount;
    transfer.to = toAccount;
    transfer.nft = punk;

    updateAccountHoldings(toAccount, fromAccount);
    punk.owner = toAccount;
    punk.numberOfTransfers = punk.numberOfTransfers + BIGINT_ONE;

    //Write
    accounts.set(fromAccount.id, fromAccount);
    accounts.set(toAccount.id, toAccount);
    punkTransfers.set(transfer.id, transfer);
    cTokens.set(cToken.id, cToken);
    punks.set(punk.id, punk);
  }

  contracts.set(contract.id, contract);
}

export function handleProxyRegistered(
  data: MappingInterface.IProxyRegistered
): void {
  const { user, proxy, timestamp, txHash, blockHash, blockNumber } = data;

  const account = accounts.get(user)!;
  const userProxy = new UserProxy({
    id: proxy,
    user: account,
    timestamp,
    txHash: hexStringToUint8Array(txHash),
    blockHash: hexStringToUint8Array(blockHash),
    blockNumber,
  });

  userProxies.set(userProxy.id, userProxy);
}
