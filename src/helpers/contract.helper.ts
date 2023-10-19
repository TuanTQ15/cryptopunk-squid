import { BIGINT_ONE, BIGINT_ZERO } from "../constant";
import { Contract } from "../model";
import { Contract as CryptoPunkContract } from "../abi/cryptopunks";
import { Contract as WrappedPunksContract } from "../abi/wrappedpunks";
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

export async function getOrCreateWrappedPunkContract(
  ctx: any,
  header: BlockHeader,
  address: string
): Promise<Contract> {
  const id = address;
  let contract = contracts.get(id);
  const wrappedPunk = new WrappedPunksContract(ctx, header, address);
  if (!contract) {
    contract = new Contract({
      id,
      totalAmountTraded: BIGINT_ZERO,
      totalSales: BIGINT_ZERO,
      symbol: await wrappedPunk.symbol(),
      name: await wrappedPunk.name(),
      totalSupply: await wrappedPunk.totalSupply(),
    });

    contracts.set(contract.id, contract);
  }

  return contract as Contract;
}

export function updateContractAggregates(
  contract: Contract,
  price: bigint
): void {
  //Update contract aggregates
  contract.totalSales = contract.totalSales + BIGINT_ONE;
  contract.totalAmountTraded = contract.totalAmountTraded + price;
}
