import { BIGINT_ONE, BIGINT_ZERO } from "../constant";
import { accounts } from "../main";
import { Account } from "../model";
import { calculateAverage } from "../utils";

export function getOrCreateAccount(address: string): Account {
  let id = address;
  let account = accounts.get(id);
  let url = "https://cryptopunks.app/cryptopunks/accountinfo?account=";

  if (!account) {
    account = new Account({ id });
    account.numberOfPunksOwned = BIGINT_ZERO;
    account.numberOfSales = BIGINT_ZERO;
    account.totalEarned = BIGINT_ZERO;
    account.numberOfTransfers = BIGINT_ZERO;
    account.numberOfPunksAssigned = BIGINT_ZERO;
    account.numberOfPurchases = BIGINT_ZERO;
    account.totalSpent = BIGINT_ZERO;
    account.averageAmountSpent = BIGINT_ZERO;
    account.accountUrl = url.concat(id);

    accounts.set(account.id, account);
  }

  return account;
}

export function updateAccountAggregates(
  fromAccount: Account,
  toAccount: Account,
  price: bigint
): void {
  //Update fromAccount aggregates
  fromAccount.numberOfSales = fromAccount.numberOfSales + BIGINT_ONE;
  fromAccount.totalEarned = fromAccount.totalEarned + price;

  //Update toAccount aggregates
  toAccount.totalSpent = toAccount.totalSpent + price;
  toAccount.numberOfPurchases = toAccount.numberOfPurchases + BIGINT_ONE;

  //We only calculate average amount spent if there are more than 0 purchases so we don't divide by 0
  if (toAccount.numberOfPurchases != BIGINT_ZERO) {
    toAccount.averageAmountSpent = calculateAverage(
      toAccount.totalSpent,
      toAccount.numberOfPurchases
    );
  }
}

export function updateAccountHoldings(
  toAccount: Account,
  fromAccount: Account
): void {
  //Update toAccount holdings
  toAccount.numberOfPunksOwned = toAccount.numberOfPunksOwned + BIGINT_ONE;

  //Update fromAccount holdings
  fromAccount.numberOfPunksOwned = fromAccount.numberOfPunksOwned - BIGINT_ONE;
}
