import { getGlobalId, hexStringToUint8Array } from "../utils";
import { sendEpnsNotification } from "../epnsNotification/EpnsNotification";
import { sales } from "../main";
import { Account, Contract, EventType, Punk, Sale } from "../model";

export function getOrCreateSale(
  fromAddress: Account,
  punk: Punk,
  logIndex: number,
  txHash: string,
  contract: Contract,
  timestamp: bigint,
  blockNumber: bigint,
  blockHash: string
): Sale {
  const saleId = getGlobalId(txHash, logIndex).concat("-SALE");
  let sale = sales.get(saleId);

  if (!sale) {
    sale = new Sale({
      id: saleId,
      contract,
      timestamp,
      blockNumber,
      txHash: hexStringToUint8Array(txHash),
      blockHash: hexStringToUint8Array(blockHash),
      logNumber: BigInt(logIndex),
      type: EventType.SALE,
    });
  }
  /**
      Find out where to properly update this field
        sale.to = toAddress.toHexString(); ***DONE
    */
  sale.from = fromAddress;
  sale.nft = punk;

  sales.set(sale.id, sale);
  return sale as Sale;
}

export function handleSaleNotification(
  punk: string,
  account: string,
  price: string,
  saleTxHash: string
): void {
  let address = "0xbCb4ED1F05b8F017CF23E739552A6D81A014Ee84"; //cryptopunks-subgraph.eth
  let recipient = `${address}`,
    type = "1",
    title = "Punk Sold",
    body = `Yeehaw! Punk: ${punk} bought by ${account} for ${price} ETH`,
    subject = "Punk Sale Event",
    message = `Yeehaw! Punk: ${punk} sold to ${account} for ${price} ETH`,
    image = `https://cryptopunks.app/public/images/cryptopunks/punk${punk}.png`,
    secret = "null",
    cta = `https://etherscan.io/tx/${saleTxHash}`;

  let notification = `{\"type\": \"${type}\", \"title\": \"${title}\", \"body\": \"${body}\", \"subject\": \"${subject}\", \"message\": \"${message}\", \"image\": \"${image}\", \"secret\": \"${secret}\", \"cta\": \"${cta}\"}`;
  sendEpnsNotification(recipient, notification);
}
