import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Trait} from "./trait.model"
import {MetaData} from "./metaData.model"

@Entity_()
export class TraitMetaData {
    constructor(props?: Partial<TraitMetaData>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Trait, {nullable: true})
    trait!: Trait

    @Index_()
    @ManyToOne_(() => MetaData, {nullable: true})
    metadata!: MetaData
}
