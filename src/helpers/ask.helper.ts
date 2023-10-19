// import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
// import {
// 	AskRemoved,
// 	AskCreated,
// 	Ask,
// 	Punk,
// 	Account,
// } from '../../generated/schema'
// import { getGlobalId } from '../utils'
// import { sendEpnsNotification } from '../epnsNotification/EpnsNotification'

import { sendEpnsNotification } from "../epnsNotification/EpnsNotification";
import { asks } from "../main";
import {
  Account,
  Ask,
  AskCreated,
  AskRemoved,
  Contract,
  EventType,
  OfferType,
  Punk,
} from "../model";
import { getGlobalId, hexStringToUint8Array } from "../utils";

export function createAskCreated(
  nft: Punk,
  contract: Contract,
  blockHash: string,
  txHash: string,
  logIndex: number,
  timestamp: bigint,
  blockNumber: bigint
): AskCreated {
  const id = getGlobalId(txHash, logIndex).concat("-ASK_CREATED");
  let askCreated = new AskCreated({
    id,
    type: EventType.ASK_CREATED,
    nft,
    logNumber: BigInt(logIndex),
    timestamp: timestamp,
    blockNumber,
    txHash: hexStringToUint8Array(txHash),
    blockHash: hexStringToUint8Array(blockHash),
    contract,
  });

  return askCreated as AskCreated;
}

export function createAskRemoved(
  nft: Punk,
  contract: Contract,
  logIndex: number,
  blockHash: string,
  timestamp: bigint,
  txHash: string,
  blockNumber: bigint
): AskRemoved {
  const id = getGlobalId(txHash, logIndex).concat("-ASK_REMOVED");
  let askRemoved = new AskRemoved({
    id,
    nft,
    type: EventType.ASK_REMOVED,
    logNumber: BigInt(logIndex),
    timestamp,
    blockHash: hexStringToUint8Array(blockHash),
    txHash: hexStringToUint8Array(txHash),
    blockNumber,
    contract,
  });
  return askRemoved as AskRemoved;
}

export function getOrCreateAsk(
  from: Account,
  txHash: string,
  logIndex: number
): Ask {
  let askId = getGlobalId(txHash, logIndex).concat("-ASK"); // -ASK, To prevent conflict with interfaces with same ID
  let ask = asks.get(askId);
  if (!ask) {
    ask = new Ask({
      id: askId,
      from,
      open: true,
      offerType: OfferType.ASK,
    });
  }

  //ask.created = "" // nullable, needs to be the id of createAskCreated in same handler if it exists.
  //ask.removed = "" //needs to be the id of createAskRemoved in same handler
  //nft - update from same handler
  //amount: BigInt! - amount can be 0 if owner offers to Address & not zero Address

  return ask as Ask;
}

export function closeOldAsk(punk: Punk, fromAccount: Account): void {
  let currentAsk = punk.currentAsk;
  if (currentAsk) {
    let oldAsk = asks.get(currentAsk.id)!;
    /**
       Create a relationship between OldAsk and currentAskRemoved to provide information on the Ask that was removed
       current askRemoved can be gotten from the punk which we closed in PunkNoLongerForSale
    */
    oldAsk.removed = punk.currentAskRemoved;
    oldAsk.open = false;

    //Summon currentAskCreated from Punk entity to update Old Ask with askCreation information
    oldAsk.created = punk.currentAskCreated; //we opened the Punk in PunkOffered() and saved the currentAskCreated to a field in the Punk entity

    oldAsk.from = fromAccount;

    //Write
    asks.set(oldAsk.id, oldAsk);
  }
}

export function handleAskNotification(
  punk: string,
  owner: string,
  price: string,
  askTxHash: string
): void {
  let address = "0xbCb4ED1F05b8F017CF23E739552A6D81A014Ee84"; //cryptopunks-subgraph.eth
  let recipient = `${address}`,
    type = "1",
    title = "New Listing",
    body = `${owner} listed Punk:${punk} for ${price} ETH`,
    subject = "Punk Offer Event",
    message = `New Listing! ${owner} wants ${price} ETH for Punk: ${punk}`,
    image = `https://cryptopunks.app/public/images/cryptopunks/punk${punk}.png`,
    secret = "null",
    cta = `https://etherscan.io/tx/${askTxHash}`;

  let notification = `{\"type\": \"${type}\", \"title\": \"${title}\", \"body\": \"${body}\", \"subject\": \"${subject}\", \"message\": \"${message}\", \"image\": \"${image}\", \"secret\": \"${secret}\", \"cta\": \"${cta}\"}`;
  sendEpnsNotification(recipient, notification);
}
