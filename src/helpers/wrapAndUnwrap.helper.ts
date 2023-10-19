import { unWraps, wraps } from "../main";
import { Account, EventType, Punk, Unwrap, Wrap } from "../model";
import { hexStringToUint8Array } from "../utils";

export function createWrap(
  id: string,
  fromAccount: Account,
  nft: Punk,
  txHash: string,
  logIndex: number,
  blockNumber: bigint,
  blockHash: string,
  timestamp: bigint
): Wrap {
  const wrapId = txHash.concat("-").concat(logIndex.toString());
  let wrap = new Wrap({
    id: wrapId,
    from: fromAccount,
    type: EventType.WRAP,
    timestamp,
    nft,
    blockNumber,
    blockHash: hexStringToUint8Array(blockHash),
    txHash: hexStringToUint8Array(txHash),
    logNumber: BigInt(logIndex),
  });

  wraps.set(wrap.id, wrap);
  return wrap;
}

export function createUnwrap(
  from: Account,
  to: Account,
  nft: Punk,
  txHash: string,
  logIndex: number,
  blockNumber: bigint,
  blockHash: string,
  timestamp: bigint
): Unwrap {
  const unWrapId = txHash.concat("-").concat(logIndex.toString());
  let unWrap = new Unwrap({
    id: unWrapId,
    from,
    to,
    type: EventType.UNWRAP,
    timestamp,
    logNumber: BigInt(logIndex),
    nft,
    blockHash: hexStringToUint8Array(blockHash),
    txHash: hexStringToUint8Array(txHash),
    blockNumber,
  });

  unWraps.set(unWrap.id, unWrap);
  return unWrap as Unwrap;
}
