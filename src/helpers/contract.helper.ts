import { BIGINT_ONE, BIGINT_ZERO } from "../constant";
import { Contract } from "../model";
import { Contract as CryptoPunkContract } from "../abi/cryptopunks";
import { BlockHeader, DataHandlerContext } from "@subsquid/evm-processor";
import { Store } from "@subsquid/typeorm-store";
import { contracts } from "../main";
// import { WrappedPunks } from "../../generated/WrappedPunks/WrappedPunks";

export async function getOrCreateCryptoPunkContract(
  ctx: DataHandlerContext<
    Store,
    {
      transaction: {
        from: true;
        value: true;
        hash: true;
      };
    }
  >,
  header: BlockHeader,
  address: string
): Promise<Contract> {
  let id = address;
  let contract = contracts.get(id);
  const cryptoPunk = new CryptoPunkContract(ctx, header, address);

  if (!contract) {
    const [symbol, name, imageHash, totalSupply] = await Promise.all([
      cryptoPunk.symbol(),
      cryptoPunk.name(),
      cryptoPunk.imageHash(),
      cryptoPunk.totalSupply(),
    ]);

    contract = new Contract({
      id,
      symbol,
      name,
      imageHash,
      totalSupply,
      totalAmountTraded: BIGINT_ZERO,
      totalSales: BIGINT_ZERO,
    });
    contracts.set(contract.id, contract);
  }

  return contract;
}

// export function getOrCreateWrappedPunkContract(address: Address): Contract {
//   let id = address.toHexString();
//   let contract = Contract.load(id);
//   let wrappedPunks = WrappedPunks.bind(address);

//   if (!contract) {
//     contract = new Contract(id);
//     contract.totalAmountTraded = BigInt.fromI32(0);
//     contract.totalSales = BigInt.fromI32(0);

//     let symbolCall = wrappedPunks.try_symbol();
//     if (!symbolCall.reverted) {
//       contract.symbol = symbolCall.value;
//     } else {
//       log.warning("symbolCall Reverted", []);
//     }

//     let nameCall = wrappedPunks.try_name();
//     if (!nameCall.reverted) {
//       contract.name = nameCall.value;
//     } else {
//       log.warning("nameCall Reverted", []);
//     }

//     let totalSupplyCall = wrappedPunks.try_totalSupply();
//     if (!totalSupplyCall.reverted) {
//       contract.totalSupply = totalSupplyCall.value;
//     } else {
//       log.warning("totalSupplyCall Reverted", []);
//     }

//     contract.save();
//   }

//   return contract as Contract;
// }

export function updateContractAggregates(
  contract: Contract,
  price: bigint
): void {
  //Update contract aggregates
  contract.totalSales = contract.totalSales + BIGINT_ONE;
  contract.totalAmountTraded = contract.totalAmountTraded + price;
}
