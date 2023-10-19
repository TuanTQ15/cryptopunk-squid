import { getGlobalId, hexStringToUint8Array } from "../utils";
import { Account, Assign, Contract, EventType, MetaData, Punk } from "../model";
import { assignEvents, punks } from "../main";
import { MappingInterface } from "../interfaces";

export function getOrCreateAssign(
  data: MappingInterface.IAssign,
  toAccount: Account,
  punk: Punk,
  metadata: MetaData,
  contract: Contract
): Assign {
  const { txHash, blockHash, logIndex, timestamp, blockNumber } = data;
  const assignId = getGlobalId(txHash, logIndex);
  let assign = assignEvents.get(assignId);

  if (!assign) {
    assign = new Assign({
      id: assignId,
    });
  }

  punk.metadata = metadata;
  punk.assignedTo = toAccount;
  punk.transferedTo = toAccount;

  assign.to = toAccount;
  assign.nft = punk;
  assign.timestamp = timestamp;
  assign.contract = contract;
  assign.blockNumber = blockNumber;
  assign.logNumber = BigInt(logIndex);
  assign.txHash = hexStringToUint8Array(txHash);
  assign.blockHash = hexStringToUint8Array(blockHash);
  assign.type = EventType.ASSIGN;

  punks.set(punk.id, punk);
  assignEvents.set(assign.id, assign);
  return assign;
}
