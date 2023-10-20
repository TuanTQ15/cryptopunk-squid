import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  ManyToOne as ManyToOne_,
  Index as Index_,
  OneToOne,
  JoinColumn,
} from "typeorm";
import * as marshal from "./marshal";
import { Account } from "./account.model";
import { Ask } from "./ask.model";
import { Contract } from "./contract.model";
import { Punk } from "./punk.model";
import { EventType } from "./_eventType";

@Entity_()
export class AskCreated {
  constructor(props?: Partial<AskCreated>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @ManyToOne_(() => Account, { nullable: true })
  from!: Account | undefined | null;

  @Index_()
  @ManyToOne_(() => Account, { nullable: true })
  to!: Account | undefined | null;

  @Index_()
  @ManyToOne_(() => Ask, { nullable: true })
  ask!: Ask | undefined | null;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: true,
  })
  amount!: bigint | undefined | null;

  @Index_()
  @ManyToOne_(() => Contract, { nullable: true })
  contract!: Contract | undefined | null;

  @OneToOne(() => Punk, (nft) => nft.currentAskCreated, { nullable: true })
  @JoinColumn({
    name: "id",
  })
  nft!: Punk | undefined | null;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: true,
  })
  logNumber!: bigint | undefined | null;

  @Column_("varchar", { length: 11, nullable: false })
  type!: EventType;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: true,
  })
  blockNumber!: bigint | undefined | null;

  @Column_("bytea", { nullable: true })
  blockHash!: Uint8Array | undefined | null;

  @Column_("bytea", { nullable: true })
  txHash!: Uint8Array | undefined | null;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: true,
  })
  timestamp!: bigint | undefined | null;
}
