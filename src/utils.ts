import { BIGINT_ONE } from "./constant";
import { cTokens } from "./main";
import { CToken } from "./model";

export function calculateAverage(totalAmount: bigint, qty: bigint): bigint {
  let average = totalAmount / qty;
  return average;
}

export function getGlobalId(hash: string, logIndex: number): string {
  let globalId = hash.concat("-").concat(logIndex.toString());
  return globalId;
}

export function uint8ArrayToHexString(uint8Array: Uint8Array) {
  const hexArray = Array.from(uint8Array, (byte) => {
    return byte.toString(16).padStart(2, "0");
  });
  return "0x" + hexArray.join("");
}

export function hexStringToUint8Array(hexString: string) {
  // Remove the '0x' prefix if present
  hexString = hexString.replace(/^0x/i, "");

  // Create a new Uint8Array with half the length of the hex string
  const uint8Array = new Uint8Array(hexString.length / 2);

  // Iterate over the hex string, converting each pair of characters to a byte
  for (let i = 0; i < hexString.length; i += 2) {
    uint8Array[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }

  return uint8Array;
}

export function getOwnerFromCToken(
  logIndex: number,
  txHash: string,
  blockNumber: bigint,
  blockHash: string,
  timestamp: bigint
): string {
  const cTokenLogIndex = BigInt(logIndex) - BIGINT_ONE;
  const id = txHash.concat("-").concat(cTokenLogIndex.toString());

  let cToken = cTokens.get(id);
  if (!cToken) {
    cToken = new CToken({
      id,
      blockNumber,
      referenceId: id,
      blockHash: hexStringToUint8Array(blockHash),
      txHash: hexStringToUint8Array(txHash),
      timestamp,
      // owner: "",
    });

    cTokens.set(cToken.id, cToken);
  }

  let owner = cToken.owner;
  return owner;
}

export function getOrCreateCToken(
  txHash: string,
  logIndex: number,
  blockNumber: bigint,
  blockHash: string,
  timestamp: bigint
): CToken {
  const id = getGlobalId(txHash, logIndex);
  let cToken = cTokens.get(id);
  if (!cToken) {
    cToken = new CToken({
      id,
      referenceId: id,
      blockNumber,
      blockHash: hexStringToUint8Array(blockHash),
      txHash: hexStringToUint8Array(txHash),
      timestamp,
    });
  }
  return cToken as CToken;
}

export function getContractAddress(
  logIndex: number,
  txHash: string
): string | null {
  //The transfer always come first, so we need to provide the correct logIndex for cToken
  let cTokenLogIndex = BigInt(logIndex) - BIGINT_ONE;

  let id = txHash.concat("-").concat(cTokenLogIndex.toString());

  /**
   * We only care about transactions concerning WrappedPunk contract
   * cToken should exist with the given ID.
   */
  let cToken = cTokens.get(id);

  // if it doesn't then it's not a WrappedPunk transaction
  if (!cToken) {
    return null;
  }

  // if it does, then return the contract Address to enable us validate the transaction in handleBuy()
  let contractAddress = cToken.referenceId;
  return contractAddress as string;
}

export function getMakerAddress(logIndex: number, txHash: string) {
  /**
   @description
   	- We only care about transactions concerning WrappedPunk contract saved from the WrappedPunk Transfer event.
    - We need the maker address to validate a bid accepted sale in the OrderMatched() event
    - The transfer always come first, so we need to provide the correct logIndex for cToken
	  - cToken should exist with the given ID in the same transaction at the time it's being called in the OrderMatched() event.
   	- if it doesn't then it's not a WrappedPunk transaction (null)
*/
  const cTokenLogIndex = BigInt(logIndex) + BIGINT_ONE;
  const id = txHash.concat("-").concat(cTokenLogIndex.toString());

  let cToken = cTokens.get(id);
  if (!cToken) {
    return null;
  }

  let makerAddress = cToken.to.id;
  return makerAddress;
}

export function getPriceAfterRaribleCut(price: bigint): bigint {
  const cutPercentage = 2.5; // 2.5%
  const cutAmount = (price * BigInt(cutPercentage)) / BigInt(100);

  const priceAfterCut = price - cutAmount;
  return priceAfterCut;
}

export function getPunkId(logIndex: number, txHash: string): string | null {
  /**
   @description
   	- We only care about transactions concerning WrappedPunk contract saved from the WrappedPunk Transfer event.
    - We need the punk ID to validate our sale in OrderMatched() event
    - The transfer always come first, so we need to provide the correct logIndex for cToken
	  - cToken should exist with the given ID in the same transaction at the time it's being called in OrderMatched() event.
   	- if it doesn't then it's not a WrappedPunk transaction (null)
*/
  const cTokenLogIndex = BigInt(logIndex) - BIGINT_ONE;

  const id = txHash.concat("-").concat(cTokenLogIndex.toString());

  const cToken = cTokens.get(id);

  if (!cToken) {
    return null;
  }

  const punk = cToken.punkId;
  return punk as string;
}
