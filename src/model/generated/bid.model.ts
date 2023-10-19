import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"
import {Punk} from "./punk.model"
import {BidCreated} from "./bidCreated.model"
import {BidRemoved} from "./bidRemoved.model"
import {OfferType} from "./_offerType"

@Entity_()
export class Bid {
    constructor(props?: Partial<Bid>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    from!: Account

    @Column_("bool", {nullable: false})
    open!: boolean

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount!: bigint

    @Index_()
    @ManyToOne_(() => Punk, {nullable: true})
    nft!: Punk | undefined | null

    @Index_()
    @ManyToOne_(() => BidCreated, {nullable: true})
    created!: BidCreated | undefined | null

    @Index_()
    @ManyToOne_(() => BidRemoved, {nullable: true})
    removed!: BidRemoved | undefined | null

    @Column_("varchar", {length: 3, nullable: false})
    offerType!: OfferType
}
