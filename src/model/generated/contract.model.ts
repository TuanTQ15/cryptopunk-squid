import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class Contract {
    constructor(props?: Partial<Contract>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: true})
    symbol!: string | undefined | null

    @Column_("text", {nullable: true})
    name!: string | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    totalSupply!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    totalSales!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    totalAmountTraded!: bigint

    @Column_("text", {nullable: true})
    imageHash!: string | undefined | null
}
