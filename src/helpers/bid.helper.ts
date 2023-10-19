import { getGlobalId, hexStringToUint8Array } from "../utils";

import { MappingInterface } from "../interfaces";
import {
  Account,
  Bid,
  BidCreated,
  BidRemoved,
  Contract,
  EventType,
  OfferType,
  Punk,
} from "../model";
import { punkBidEnteredEvents } from "../main";
import { sendEpnsNotification } from "../epnsNotification/EpnsNotification";

//Update the state of the last Bid
export function getOrCreateBid(
  data: MappingInterface.IPunkBidEntered,
  from: Account
): Bid {
  const { blockNumber, fromAddress, logIndex, txHash } = data;

  let bidId = getGlobalId(txHash, logIndex).concat("-BID"); // -BID, To prevent conflict with interfaces with same ID
  let bid = punkBidEnteredEvents.get(bidId); //Should not be null
  if (!bid) {
    bid = new Bid({
      id: bidId,
      from,
      offerType: OfferType.BID,
      open: true,
    });
  }

  return bid as Bid;
}

//Record a new BidCreated EVENT anytime we observe one
export function createBidCreated(
  data: MappingInterface.IPunkBidEntered,
  punk: Punk,
  from: Account,
  contract: Contract
): BidCreated {
  const { txHash, blockHash, logIndex, timestamp, blockNumber } = data;
  const bidId = getGlobalId(txHash, logIndex).concat("-BID_CREATED");
  let bidCreated = new BidCreated({
    id: bidId,
    type: EventType.BID_CREATED,
    nft: punk,
    from,
    timestamp,
    logNumber: BigInt(logIndex),
    blockNumber,
    txHash: hexStringToUint8Array(txHash),
    blockHash: hexStringToUint8Array(blockHash),
    contract,
  });

  return bidCreated as BidCreated;
}

// //Record a new BidRemoved event anytime we observe one
export function createBidRemoved(
  data: MappingInterface.IPunkBidWithdrawn,
  punk: Punk,
  from: Account,
  contract: Contract
): BidRemoved {
  const { txHash, blockHash, logIndex, timestamp, blockNumber } = data;
  const bidId = getGlobalId(txHash, logIndex).concat("-BID_REMOVED");
  let bidRemoved = new BidRemoved({
    id: bidId,
    from,
    contract,
    nft: punk,
    timestamp,
    blockNumber,
    blockHash: hexStringToUint8Array(blockHash),
    logNumber: BigInt(logIndex),
    txHash: hexStringToUint8Array(txHash),
    type: EventType.BID_REMOVED,
  });

  return bidRemoved;
}

export function closeOldBid(punk: Punk, toAccount: Account): void {
  let oldBidId = punk.currentBid;
  if (oldBidId) {
    let oldBid = punkBidEnteredEvents.get(oldBidId.id)!;
    if (oldBid.from.id == toAccount.id) {
      oldBid.created = punk.currentBidCreated;
      oldBid.open = false;
      punkBidEnteredEvents.set(oldBid.id, oldBid);
    }
  }
}

export function handleBidNotification(
  punk: string,
  bidder: string,
  price: string,
  data: MappingInterface.IPunkBidEntered
): void {
  const { txHash } = data;
  let address = "0xbCb4ED1F05b8F017CF23E739552A6D81A014Ee84"; //cryptopunks-subgraph.eth
  let bidTxHash = txHash;
  let recipient = `${address}`,
    type = "1",
    title = "New Punk Bid",
    body = `New Bid for Punk: ${punk} for ${price} ETH by ${bidder}`,
    subject = "Punk Bid Event",
    message = `${bidder} placed a ${price} ETH bid for Punk: ${punk}`,
    image = `https://cryptopunks.app/public/images/cryptopunks/punk${punk}.png`,
    secret = "null",
    cta = `https://etherscan.io/tx/${bidTxHash}`;

  let notification = `{\"type\": \"${type}\", \"title\": \"${title}\", \"body\": \"${body}\", \"subject\": \"${subject}\", \"message\": \"${message}\", \"image\": \"${image}\", \"secret\": \"${secret}\", \"cta\": \"${cta}\"}`;
  sendEpnsNotification(recipient, notification);
}
