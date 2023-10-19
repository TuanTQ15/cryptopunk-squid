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

export interface IAssign extends IBase {
  punkIndex: bigint;
  to: string;
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

export interface IPunkBidEntered extends IBase {
  punkIndex: bigint;
  value: bigint;
  fromAddress: string;
}

export interface IPunkBidWithdrawn extends IPunkBidEntered {}

export interface IPunkBought extends IPunkBidEntered {
  toAddress: string;
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

export interface IPunkNoLongerForSale extends IBase {
  punkIndex: bigint;
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

export interface IPunkOffered extends IBase {
  minValue: bigint;
  toAddress: string;
  punkIndex: bigint;
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

export interface IPunkTransfer extends IBase {
  punkIndex: bigint;
  from: string;
  to: string;
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

export interface ITransfer extends IBase {
  from: string;
  to: string;
  value: bigint;
}
