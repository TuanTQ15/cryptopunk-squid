import { WRAPPED_PUNK_ADDRESS } from "../constant";
import {
  getOrCreateAccount,
  updateAccountAggregates,
} from "../helpers/account.helper";
import { closeOldBid } from "../helpers/bid.helper";
import {
  getOrCreateWrappedPunkContract,
  updateContractAggregates,
} from "../helpers/contract.helper";
import { updatePunkSaleAggregates } from "../helpers/punk.helper";
import { getOrCreateSale } from "../helpers/sale.helper";
import { MarketplaceInterface } from "../interfaces";
import { accounts, contracts, punks, sales } from "../main";
import {
  getContractAddress,
  getMakerAddress,
  getPriceAfterRaribleCut,
  getPunkId,
} from "../utils";

export async function handleERC721Buy(
  data: MarketplaceInterface.IERC721Buy
): Promise<void> {
  const {
    tokenId,
    seller,
    buyer,
    price,
    logIndex,
    txHash,
    blockHash,
    blockNumber,
    timestamp,
    ctx,
    header,
  } = data;

  const wrappedPunkContractAddress = getContractAddress(logIndex, txHash);
  if (
    wrappedPunkContractAddress !== null &&
    wrappedPunkContractAddress == WRAPPED_PUNK_ADDRESS
  ) {
    const contract = await getOrCreateWrappedPunkContract(
      ctx,
      header,
      wrappedPunkContractAddress
    );
    const fromAccount = getOrCreateAccount(seller);
    const toAccount = getOrCreateAccount(buyer);
    const punk = punks.get(tokenId.toString())!;
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
    sale.to = fromAccount;

    closeOldBid(punk, toAccount);
    updateAccountAggregates(fromAccount, toAccount, price);
    updateContractAggregates(contract, price);
    updatePunkSaleAggregates(punk, price);

    accounts.set(toAccount.id, toAccount);
    accounts.set(fromAccount.id, fromAccount);
    sales.set(sale.id, sale);
    punks.set(punk.id, punk);
    contracts.set(contract.id, contract);
  }
}

export async function handleExchangeV1Buy(
  data: MarketplaceInterface.IExchangeV1Buy
): Promise<void> {
  const {
    owner,
    buyer: inputBuyer,
    buyTokenId,
    sellTokenId,
    logIndex,
    txHash,
    timestamp,
    blockHash,
    blockNumber,
    buyValue,
    ctx,
    header,
  } = data;

  const wrappedPunkContractAddress = getContractAddress(logIndex, txHash);
  if (
    wrappedPunkContractAddress &&
    wrappedPunkContractAddress == WRAPPED_PUNK_ADDRESS
  ) {
    const trueBuyer = getMakerAddress(logIndex, txHash);
    if (trueBuyer && trueBuyer == owner) {
      const price = buyValue;
      const buyer = owner;
      const seller = inputBuyer;
      const tokenId = buyTokenId.toString();

      const bidPrice = getPriceAfterRaribleCut(price);

      const contract = await getOrCreateWrappedPunkContract(
        ctx,
        header,
        wrappedPunkContractAddress
      );
      const fromAccount = getOrCreateAccount(seller);
      const toAccount = getOrCreateAccount(buyer);
      const punk = punks.get(tokenId)!;
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
      sale.to = fromAccount;
      updateContractAggregates(contract, bidPrice);
      updateAccountAggregates(fromAccount, toAccount, bidPrice);
      updatePunkSaleAggregates(punk, bidPrice);

      //Write
      accounts.set(toAccount.id, toAccount);
      accounts.set(fromAccount.id, fromAccount);
      sales.set(sale.id, sale);
      contracts.set(contract.id, contract);
      punks.set(punk.id, punk);
    } else if (trueBuyer && trueBuyer == inputBuyer) {
      /**
			 @summary - Logic for Regular Sale
				- Example: https://etherscan.io/tx/0x51583622e0dcfda43c6481ba073eb1bbd6b7f3ef98c28d3564918491344d8ce3#eventlog
			 */
      const buyer = inputBuyer;
      const price = buyValue;
      const seller = owner;
      const tokenId = sellTokenId.toString();

      const contract = await getOrCreateWrappedPunkContract(
        ctx,
        header,
        wrappedPunkContractAddress
      );
      const fromAccount = getOrCreateAccount(seller);
      const toAccount = getOrCreateAccount(buyer);
      const punk = punks.get(tokenId)!;
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
      updateContractAggregates(contract, price);
      updateAccountAggregates(fromAccount, toAccount, price);
      updatePunkSaleAggregates(punk, price);

      //Write
      accounts.set(toAccount.id, toAccount);
      accounts.set(fromAccount.id, fromAccount);
      sales.set(sale.id, sale);
      contracts.set(contract.id, contract);
      punks.set(punk.id, punk);
    }
  }
}

export async function handleOpenSeaSale(
  data: MarketplaceInterface.IOpenseaBuy
): Promise<void> {
  /**
      @summary OpenSea Contract - Track WRAPPEDPUNK sale
	  @description:
    	 ROOT ISSUE:  Punk 7443 was sold on Opensea while wrapped.
      		- Account: https://cryptopunks.app/cryptopunks/accountinfo?account=0x0eb9a7ff5cbf719251989caf1599c1270eafb531
        	- Example: https://etherscan.io/tx/0xac6acdca9aeb00238ff885dcd4e697afd1cfa8ba75ef69622f786b96f8d164cf#eventlog
        - We want to capture this so we can calculate average prices & update other aggregates both for punk & account
		
		- We filter out wrappedPunk transactions by ensuring
			- both events occur in the same transaction
			- the wrappedPunk contract address emitted it
	 */
  const {
    maker,
    taker,
    price,
    logIndex,
    txHash,
    blockHash,
    blockNumber,
    timestamp,
    ctx,
    header,
  } = data;

  const wrappedPunkContractAddress = getContractAddress(logIndex, txHash);
  if (
    wrappedPunkContractAddress !== null &&
    wrappedPunkContractAddress == WRAPPED_PUNK_ADDRESS
  ) {
    //We get the tokenId from the Transfer event because OrderMatched doesn't emit it.
    const tokenId = getPunkId(logIndex, txHash);

    //We need the makerAddress to differentiate a regular sale from a bidAccepted sale
    const makerAddress = getMakerAddress(logIndex, txHash);

    //All the operations below wouldn't make sense without the punkId, so we ensure it exists.
    if (tokenId) {
      const punk = punks.get(tokenId)!;

      const contract = await getOrCreateWrappedPunkContract(
        ctx,
        header,
        wrappedPunkContractAddress
      );
      if (makerAddress && makerAddress == taker) {
        //Regular wrappedPunk sale

        const buyer = taker;
        const seller = maker;

        const fromAccount = getOrCreateAccount(seller);
        const toAccount = getOrCreateAccount(buyer);
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

        updateAccountAggregates(fromAccount, toAccount, price);
        updateContractAggregates(contract, price);
        updatePunkSaleAggregates(punk, price);

        accounts.set(toAccount.id, toAccount);
        accounts.set(fromAccount.id, fromAccount);
        sales.set(sale.id, sale);
        punks.set(punk.id, punk);
        contracts.set(contract.id, contract);
      } else if (makerAddress && makerAddress == maker) {
        /**
           @summary Logic for validating bidAccepted sale:
		   @description 
		  	- We want to capture this sale.
                - The major difference between this sale and a regular sale is that
                    - the maker becomes the buyer --> (toAccount)
                    - the taker becomes the seller --> (fromAccount)
                - Example:
                     https://etherscan.io/tx/0x0e44a5eb1d553ab2daacf43fd50bcd73f030e739de009368a9f2897150e1215d#eventlog

            - Getting the maker address from the toAccount in the wrappedPunk Transfer event confirms that
              this is a bid accepted sale because the maker is the buyer, but in the OrderMatched event, the maker is the seller.
        */
        const seller = taker;
        const buyer = maker;

        const fromAccount = getOrCreateAccount(seller);
        const toAccount = getOrCreateAccount(buyer);
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
        updateAccountAggregates(fromAccount, toAccount, price);
        updateContractAggregates(contract, price);
        updatePunkSaleAggregates(punk, price);

        accounts.set(toAccount.id, toAccount);
        accounts.set(fromAccount.id, fromAccount);
        sales.set(sale.id, sale);
        punks.set(punk.id, punk);
        contracts.set(contract.id, contract);
      }
    }
  }
}
