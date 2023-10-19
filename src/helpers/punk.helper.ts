import { BIGINT_ONE, BIGINT_ZERO } from "../constant";

import { Account, Punk } from "../model";
import { calculateAverage } from "../utils";

export function createPunk(tokenId: bigint, owner: Account): Punk {
  let punk = new Punk({
    id: tokenId.toString(),
  });
  punk.wrapped = false;
  punk.tokenId = tokenId;
  punk.owner = owner;
  punk.numberOfTransfers = BIGINT_ZERO;
  punk.numberOfSales = BIGINT_ZERO;
  punk.totalAmountSpentOnPunk = BIGINT_ZERO;
  punk.averageSalePrice = BIGINT_ZERO;

  return punk as Punk;
}

export function updatePunkSaleAggregates(punk: Punk, price: bigint): void {
  //Update punk aggregates
  punk.totalAmountSpentOnPunk = punk.totalAmountSpentOnPunk + price;
  punk.numberOfSales = punk.numberOfSales + BIGINT_ONE;

  //We only calculate average sale price if there are more than 0 sales so we don't divide by 0
  if (punk.numberOfSales != BIGINT_ZERO) {
    punk.averageSalePrice = calculateAverage(
      punk.totalAmountSpentOnPunk,
      punk.numberOfSales
    );
  }
}

export function updatePunkOwner(punk: Punk, toAccount: Account): void {
  //Update Punk entity
  punk.purchasedBy = toAccount;
  punk.owner = toAccount;
}
