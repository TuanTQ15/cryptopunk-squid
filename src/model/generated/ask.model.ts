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
import { Punk } from "./punk.model";
import { AskCreated } from "./askCreated.model";
import { AskRemoved } from "./askRemoved.model";
import { OfferType } from "./_offerType";

@Entity_()
export class Ask {
  constructor(props?: Partial<Ask>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @ManyToOne_(() => Account, { nullable: true })
  from!: Account;

  @Column_("bool", { nullable: false })
  open!: boolean;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  amount!: bigint;

  @OneToOne(() => Punk, (nft) => nft.currentAsk, { nullable: true })
  @JoinColumn({
    name: "id",
  })
  nft!: Punk | undefined | null;

  @Index_()
  @ManyToOne_(() => AskCreated, { nullable: true })
  created!: AskCreated | undefined | null;

  @Index_()
  @ManyToOne_(() => AskRemoved, { nullable: true })
  removed!: AskRemoved | undefined | null;

  @Column_("varchar", { length: 3, nullable: false })
  offerType!: OfferType;
}
