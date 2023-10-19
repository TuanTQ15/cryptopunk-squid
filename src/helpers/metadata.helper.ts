import { CONTRACT_URI, TOKEN_URI } from "../constant";
import { MetaData, Punk, TraitMetaData } from "../model";

export function createMetadata(
  punk: Punk,
  metaDatas: Map<string, MetaData>
): MetaData {
  const punkId = punk.id;
  let metadata = new MetaData({
    id: punkId,
  });
  metadata.tokenURI = TOKEN_URI.concat(punkId);
  metadata.contractURI = CONTRACT_URI;
  metadata.tokenId = BigInt(punkId);
  metadata.punk = punk;
  metadata.contractURI = CONTRACT_URI;

  metadata.traits = new Array<TraitMetaData>();

  metaDatas.set(metadata.id, metadata);

  return metadata;
}
