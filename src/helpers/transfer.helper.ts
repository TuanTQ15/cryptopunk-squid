import { punkTransfers } from "../main";
import { Contract, EventType, Punk, Transfer } from "../model";
import { getGlobalId, hexStringToUint8Array } from "../utils";

export function getOrCreateTransfer(
  punk: Punk,
  contract: Contract,
  txHash: string,
  logIndex: number,
  timestamp: bigint,
  blockHash: string,
  blockNumber: bigint
): Transfer {
  const id = getGlobalId(txHash, logIndex).concat("-TRANSFER");
  let transfer = punkTransfers.get(id);
  if (!transfer) {
    transfer = new Transfer({
      id,
      timestamp,
      blockNumber,
      blockHash: hexStringToUint8Array(blockHash),
      txHash: hexStringToUint8Array(txHash),
      nft: punk,
      contract,
      logNumber: BigInt(logIndex),
      type: EventType.TRANSFER,
    });
  }

  return transfer as Transfer;
}
