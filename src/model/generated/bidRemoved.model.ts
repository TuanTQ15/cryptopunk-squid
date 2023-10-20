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
import { Bid } from "./bid.model";
import { Contract } from "./contract.model";
import { Punk } from "./punk.model";
import { EventType } from "./_eventType";

@Entity_()
export class BidRemoved {
  constructor(props?: Partial<BidRemoved>) {
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

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: true,
  })
  amount!: bigint | undefined | null;

  @OneToOne(() => Bid, (bid) => bid.removed)
  @JoinColumn({
    name: "id",
    foreignKeyConstraintName: "fk_bid_bid_removed",
  })
  bid!: Bid | undefined | null;

  @Index_()
  @ManyToOne_(() => Contract, { nullable: true })
  contract!: Contract | undefined | null;

  @OneToOne(() => Punk, (bid) => bid.currentBidRemoved, { nullable: true })
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
