import { BlockHeader } from "@subsquid/evm-processor";
import { Contract as CryptoPunksData } from "../abi/CryptoPunksData";
import { metaDatas, punks } from "../main";

export async function handleBlock(
  header: BlockHeader,
  ctx: any
): Promise<void> {
  const { height } = header;
  if (height >= 13047091 && height < 13057091) {
    const index = height - 13047091;

    const data = new CryptoPunksData(
      ctx,
      header,
      "0x16f5a35647d6f03d5d3da7b35409d65ba03af3b2"
    );
    //  let attributes = data.punkAttributes(BigInt.fromI32(index));
    const svg = await data.punkImageSvg(index);
    const image = await data.punkImage(index);

    const punk = punks.get(index.toString())!;
    const metadata = metaDatas.get(index.toString())!;

    metadata.svg = svg;
    metadata.image = image;

    punk.metadata = metadata;

    punks.set(punk.id, punk);
    metaDatas.set(metadata.id, metadata);
  }
}
