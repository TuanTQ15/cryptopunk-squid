import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {TraitType} from "./_traitType"
import {TraitMetaData} from "./traitMetaData.model"

@Entity_()
export class Trait {
    constructor(props?: Partial<Trait>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("varchar", {length: 9, nullable: false})
    type!: TraitType

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    numberOfNfts!: bigint

    @OneToMany_(() => TraitMetaData, e => e.trait)
    metaDatas!: TraitMetaData[]
}
