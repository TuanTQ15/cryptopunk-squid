import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {Punk} from "./punk.model"
import {Sale} from "./sale.model"
import {Assign} from "./assign.model"
import {Transfer} from "./transfer.model"
import {Bid} from "./bid.model"
import {Ask} from "./ask.model"

@Entity_()
export class Account {
    constructor(props?: Partial<Account>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @OneToMany_(() => Punk, e => e.owner)
    punksOwned!: Punk[]

    @OneToMany_(() => Sale, e => e.to)
    bought!: Sale[]

    @OneToMany_(() => Punk, e => e.owner)
    nftsOwned!: Punk[]

    @OneToMany_(() => Assign, e => e.to)
    assigned!: Assign[]

    @OneToMany_(() => Transfer, e => e.from)
    sent!: Transfer[]

    @OneToMany_(() => Transfer, e => e.to)
    received!: Transfer[]

    @OneToMany_(() => Bid, e => e.from)
    bids!: Bid[]

    @OneToMany_(() => Ask, e => e.from)
    asks!: Ask[]

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfPunksOwned!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfPunksAssigned!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfTransfers!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfSales!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfPurchases!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    totalSpent!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    totalEarned!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    averageAmountSpent!: bigint

    @Column_("text", {nullable: false})
    accountUrl!: string
}
