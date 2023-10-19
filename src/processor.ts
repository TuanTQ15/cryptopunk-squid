import { lookupArchive } from "@subsquid/archive-registry";
import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
} from "@subsquid/evm-processor";
import { events as CryptoPunkEvent } from "./abi/cryptopunks";
import { events as WrappedPunkEvent } from "./abi/wrappedpunks";
import { events as ERC72Event } from "./abi/ERC721Sale";
import { events as RaribleEvent } from "./abi/RaribleExchangeV1";
import { events as OpenseaEvent } from "./abi/Opensea";

const CRYPTO_PUNK_CONTRACT =
  "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB".toLowerCase();
const WRAPPED_PUNK_CONTRACT =
  "0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6".toLowerCase();
const ERC721_SALE_CONTRACT =
  "0x131aebbfe55bca0c9eaad4ea24d386c5c082dd58".toLowerCase();

const RARIBLE_EXCHANGEV1_CONTRACT =
  "0xcd4ec7b66fbc029c116ba9ffb3e59351c20b5b06".toLowerCase();

const OPENSEA_CONTRACT =
  "0x7be8076f4ea4a4ad08075c2508e481d6c946d12b".toLowerCase();

const CRYPTO_PUNKS_DATA_CONTRACT =
  "0x16F5A35647D6F03D5D3da7b35409D65ba03aF3B2".toLowerCase();

export const processor = new EvmBatchProcessor()
  .setDataSource({
    archive: lookupArchive("eth-mainnet"),
    chain: {
      url: "https://rpc.ankr.com/eth",
      rateLimit: 10,
    },
  })
  .setFinalityConfirmation(75)
  .setFields({
    transaction: {
      from: true,
      value: true,
      hash: true,
    },
  })
  .setBlockRange({
    from: 3_914_494,
  })
  .addLog({
    address: [CRYPTO_PUNK_CONTRACT],
    topic0: [
      CryptoPunkEvent.Assign.topic,
      CryptoPunkEvent.PunkBidEntered.topic,
      CryptoPunkEvent.PunkBidWithdrawn.topic,
      CryptoPunkEvent.PunkBought.topic,
      CryptoPunkEvent.PunkNoLongerForSale.topic,
      CryptoPunkEvent.PunkOffered.topic,
      CryptoPunkEvent.PunkTransfer.topic,
      CryptoPunkEvent.Transfer.topic,
    ],
    transaction: true,
  })
  .addLog({
    address: [WRAPPED_PUNK_CONTRACT],
    topic0: [
      WrappedPunkEvent.Transfer.topic,
      WrappedPunkEvent.ProxyRegistered.topic,
    ],
  })
  .addLog({
    address: [ERC721_SALE_CONTRACT],
    topic0: [ERC72Event.Buy.topic],
  })
  .addLog({
    address: [RARIBLE_EXCHANGEV1_CONTRACT],
    topic0: [RaribleEvent.Buy.topic],
  })
  .addLog({
    address: [OPENSEA_CONTRACT],
    topic0: [OpenseaEvent.OrdersMatched.topic],
  });

export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>;
