import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  ManyToOne as ManyToOne_,
  Index as Index_,
  OneToMany as OneToMany_,
} from "typeorm";
import * as marshal from "./marshal";
import { Account } from "./account.model";
import { MetaData } from "./metaData.model";
import { Contract } from "./contract.model";
import { Ask } from "./ask.model";
import { Bid } from "./bid.model";
import { AskCreated } from "./askCreated.model";
import { BidCreated } from "./bidCreated.model";
import { AskRemoved } from "./askRemoved.model";
import { BidRemoved } from "./bidRemoved.model";
import { Assign } from "./assign.model";
import { Sale } from "./sale.model";
import { Transfer } from "./transfer.model";

@Entity_()
export class Punk {
  constructor(props?: Partial<Punk>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @ManyToOne_(() => Account, { nullable: true })
  transferedTo!: Account | undefined | null;

  @Index_()
  @ManyToOne_(() => Account, { nullable: true })
  assignedTo!: Account | undefined | null;

  @Index_()
  @ManyToOne_(() => Account, { nullable: true })
  purchasedBy!: Account | undefined | null;

  @Index_()
  @ManyToOne_(() => MetaData, { nullable: true })
  metadata!: MetaData | undefined | null;

  @Index_()
  @ManyToOne_(() => Contract, { nullable: true })
  contract!: Contract | undefined | null;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  tokenId!: bigint;

  @Index_()
  @ManyToOne_(() => Account, { nullable: true })
  owner!: Account;

  @Column_("bool", { nullable: false })
  wrapped!: boolean;

  @Index_()
  @ManyToOne_(() => Ask, { nullable: true })
  currentAsk!: Ask | undefined | null;

  @Index_()
  @ManyToOne_(() => Bid, { nullable: true })
  currentBid!: Bid | undefined | null;

  @Index_()
  @ManyToOne_(() => AskCreated, { nullable: true })
  currentAskCreated!: AskCreated | undefined | null;

  @Index_()
  @ManyToOne_(() => BidCreated, { nullable: true })
  currentBidCreated!: BidCreated | undefined | null;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  numberOfTransfers!: bigint;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  numberOfSales!: bigint;

  @Index_()
  @ManyToOne_(() => AskRemoved, { nullable: true })
  currentAskRemoved!: AskRemoved | undefined | null;

  @Index_()
  @ManyToOne_(() => BidRemoved, { nullable: true })
  currentBidRemoved!: BidRemoved | undefined | null;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  totalAmountSpentOnPunk!: bigint;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  averageSalePrice!: bigint;

  @OneToMany_(() => Assign, (e) => e.nft)
  assigns!: Assign[];

  @OneToMany_(() => Sale, (e) => e.nft)
  sales!: Sale[];

  @OneToMany_(() => AskCreated, (e) => e.nft)
  createdAsks!: AskCreated[];

  @OneToMany_(() => BidCreated, (e) => e.nft)
  createdBids!: BidCreated[];

  @OneToMany_(() => BidRemoved, (e) => e.nft)
  removedBids!: BidRemoved[];

  @OneToMany_(() => AskRemoved, (e) => e.nft)
  removedAsks!: AskRemoved[];

  @OneToMany_(() => Transfer, (e) => e.nft)
  transfers!: Transfer[];
}
