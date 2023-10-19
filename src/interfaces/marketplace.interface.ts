import { BlockHeader, DataHandlerContext } from "@subsquid/evm-processor";
import { Store } from "@subsquid/typeorm-store";

export interface IBase {
  blockHash: string;
  txHash: string;
  logIndex: number;
  timestamp: bigint;
  address: string;
  blockNumber: bigint;
}

export interface IERC721Buy extends IBase {
  tokenId: bigint;
  seller: string;
  buyer: string;
  price: bigint;
  header: BlockHeader;
  ctx: DataHandlerContext<
    Store,
    {
      transaction: {
        from: true;
        value: true;
        hash: true;
      };
    }
  >;
}

export interface IExchangeV1Buy extends IBase {
  owner: string;
  buyer: string;
  buyTokenId: bigint;
  sellTokenId: bigint;
  buyValue: bigint;
  header: BlockHeader;
  ctx: DataHandlerContext<
    Store,
    {
      transaction: {
        from: true;
        value: true;
        hash: true;
      };
    }
  >;
}

export interface IOpenseaBuy extends IBase {
  maker: string;
  taker: string;
  price: bigint;
  header: BlockHeader;
  ctx: DataHandlerContext<
    Store,
    {
      transaction: {
        from: true;
        value: true;
        hash: true;
      };
    }
  >;
}
