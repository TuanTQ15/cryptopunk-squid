import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  ManyToOne as ManyToOne_,
  Index as Index_,
  OneToMany as OneToMany_,
  JoinColumn,
  OneToOne,
} from "typeorm";
import * as marshal from "./marshal";
import { Punk } from "./punk.model";
import { TraitMetaData } from "./traitMetaData.model";

@Entity_()
export class MetaData {
  constructor(props?: Partial<MetaData>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  tokenId!: bigint;

  @Column_("text", { nullable: false })
  tokenURI!: string;

  @Column_("text", { nullable: true })
  image!: string | undefined | null;

  @Column_("text", { nullable: true })
  svg!: string | undefined | null;

  @Column_("text", { nullable: false })
  contractURI!: string;

  @OneToOne(() => Punk, (punk) => punk.metadata)
  @JoinColumn({
    name: "id",
  })
  punk!: Punk | undefined | null;

  @OneToMany_(() => TraitMetaData, (e) => e.metadata)
  traits!: TraitMetaData[];
}
