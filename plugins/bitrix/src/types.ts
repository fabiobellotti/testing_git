import { ChannelProvider } from '@hcengineering/contact'
import { AttachedDoc, Class, Doc, Ref } from '@hcengineering/core'
import { ExpertKnowledge, InitialKnowledge, MeaningfullKnowledge } from '@hcengineering/tags'

/**
 * @public
 */
export interface BitrixProfile {
  ID: string
  ADMIN: boolean
  NAME: string
  LAST_NAME: string
  PERSONAL_GENDER: string
  PERSONAL_PHOTO: string
  TIME_ZONE: string
  TIME_ZONE_OFFSET: number
}

/**
 * @public
 */
export type NumberString = string
/**
 * @public
 */
export type ISODate = string
/**
 * @public
 */
export type BoolString = 'Y' | 'N'
/**
 * @public
 */
export type GenderString = 'M' | 'F' | ''

/**
 * @public
 */
export interface MultiField {
  readonly ID: NumberString
  readonly VALUE_TYPE: string
  readonly VALUE: string
  readonly TYPE_ID: string
}
/**
 * @public
 */
export type MultiFieldArray = ReadonlyArray<Pick<MultiField, 'VALUE' | 'VALUE_TYPE'>>

/**
 * @public
 */
export interface StatusValue {
  CATEGORY_ID: string | null
  COLOR: string | null
  ENTITY_ID: string | null
  ID: number
  NAME: string
  NAME_INIT: string | null
  SEMANTICS: string | null
  SORT: string | null
  STATUS_ID: string | null
  SYSTEM: 'Y' | 'N'
}

/**
 * @public
 */

export interface BitrixResult {
  result: any
  next: number
  total: number
}

/**
 * @public
 */
export interface LoginInfo {
  endpoint: string
  email: string
  token: string
}

/**
 * @public
 */
export interface BitrixSyncDoc extends Doc {
  type?: string
  bitrixId: string
  syncTime?: number
  // raw bitrix document data.
  rawData?: any
}

/**
 * @public
 */
export enum BitrixEntityType {
  Comment = 'crm.timeline.comment',
  Binding = 'crm.timeline.bindings',
  Lead = 'crm.lead',
  Activity = 'crm.activity',
  Company = 'crm.company',
  Contact = 'crm.contact'
}

/**
 * @public
 */
export interface BitrixOwnerType {
  ID: string
  NAME: string
  SYMBOL_CODE: string
}

/**
 * @public
 */
export const mappingTypes = [
  { label: 'Leads', id: BitrixEntityType.Lead },
  { label: 'Company', id: BitrixEntityType.Company },
  { label: 'Contacts', id: BitrixEntityType.Contact }
]

/**
 * @public
 */
export interface FieldValue {
  type: string
  statusType?: string
  isRequired: boolean
  isReadOnly: boolean
  isImmutable: boolean
  isMultiple: boolean
  isDynamic: boolean
  title: string

  formLabel?: string
  filterLabel?: string
  items?: Array<{
    ID: string
    VALUE: string
  }>
}

/**
 * @public
 */
export interface Fields {
  [key: string]: FieldValue
}

/**
 * @public
 */
export interface BitrixEntityMapping extends Doc {
  ofClass: Ref<Class<Doc>>
  type: string
  bitrixFields: Fields

  fields: number

  comments: boolean
  activity: boolean
  attachments: boolean
}
/**
 * @public
 */
export enum MappingOperation {
  CopyValue,
  CreateTag, // Create tag
  CreateChannel, // Create channel
  DownloadAttachment,
  FindReference
}
/**
 * @public
 */
export interface CopyPattern {
  text: string
  field?: string
  alternatives?: string[]
}
/**
 * @public
 */
export interface CopyValueOperation {
  kind: MappingOperation.CopyValue
  patterns: CopyPattern[]
}

/**
 * @public
 */
export interface TagField {
  weight: InitialKnowledge | MeaningfullKnowledge | ExpertKnowledge

  field: string
  split: string // If defined values from field will be split to check for multiple values.
}
/**
 * @public
 */
export interface CreateTagOperation {
  kind: MappingOperation.CreateTag

  fields: TagField[]
}

/**
 * @public
 */
export interface ChannelFieldMapping {
  provider: Ref<ChannelProvider>
  field: string
  include?: string // Regexp pattern to match value.
  exclude?: string // Regexp pattern to match value.
}

/**
 * @public
 */
export interface CreateChannelOperation {
  kind: MappingOperation.CreateChannel
  fields: ChannelFieldMapping[]
}

/**
 * @public
 */
export interface DownloadAttachmentOperation {
  kind: MappingOperation.DownloadAttachment

  fields: { field: string }[]
}

/**
 * @public
 */
export interface FindReferenceOperation {
  kind: MappingOperation.FindReference

  field: string

  // If missing will trigger sync for this kind with extraFilter ID={referenceID}
  // If defined will be used to synchronize
  referenceType?: BitrixEntityType | null

  referenceClass: Ref<Class<Doc>>
}

/**
 * @public
 */
export interface BitrixFieldMapping extends AttachedDoc {
  ofClass: Ref<Class<Doc>> // Specify mixin if applicable
  attributeName: string

  operation:
  | CopyValueOperation
  | CreateTagOperation
  | CreateChannelOperation
  | DownloadAttachmentOperation
  | FindReferenceOperation
}

/**
 * @public
 */
export interface BitrixCommunication {
  ID: string
  TYPE: 'EMAIL' | 'TASK'
  VALUE: string // "a@gmail.com",
  ENTITY_ID: string // "89013",
  ENTITY_TYPE_ID: string // "1",
  ENTITY_SETTINGS: {
    HONORIFIC: string
    NAME: string
    SECOND_NAME: string
    LAST_NAME: string
    LEAD_TITLE: string
  }
}

/**
 * @public
 */
export interface BitrixActivity {
  ID: string
  SUBJECT: string
  PROVIDER_TYPE_ID: 'EMAIL' | 'TASK'
  COMMUNICATIONS?: BitrixCommunication[]
  DESCRIPTION: string
  DIRECTION: '1' | '2'
  AUTHOR_ID: string
  CREATED: number
  SETTINGS?: {
    MESSAGE_HEADERS?: Record<string, string> & {
      'Message-Id': string // "<crm.activity.226613-8PWA4M@a.com>",
      'Reply-To': string // "manager@a.com"
    }
    EMAIL_META?: Record<string, string> & {
      __email: string // some email
      from: string // From email address
      replyTo: string // '
      to: string // To email address
      cc: string
      bcc: string
    }
  }
}
/**
 * @public
 */
export type BitrixFiles = Record<
string,
{
  authorId: string
  authorName: string
  date: string
  id: number
  image: boolean
  name: string
  size: number
  type: string
  urlDownload: string
  urlShow: string
}
>
