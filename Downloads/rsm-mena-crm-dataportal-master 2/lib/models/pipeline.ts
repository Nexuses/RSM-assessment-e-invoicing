import mongoose, { Schema, models } from "mongoose"

export type PipelineStage = "hot" | "meeting scheduled" | "meeting done" | "opportunity"
export type PipelineSolution = "risk" | "cyber training" | "cyber advisory"

export type PipelineNoteCategory = "call" | "note" | "email" | "meeting"

export interface IPipelineNote {
  authorId: mongoose.Types.ObjectId
  comment: string
  createdAt: Date
  category: PipelineNoteCategory
}

export interface IPipeline extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  data: Record<string, any>
  stage: PipelineStage
  solution: PipelineSolution
  notes: IPipelineNote[]
  createdAt: Date
  updatedAt: Date
}

const pipelineNoteSchema = new Schema<IPipelineNote>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    category: { type: String, enum: ["call","note","email","meeting"], default: "note", index: true },
  },
  { _id: false }
)

const pipelineSchema = new Schema<IPipeline>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    data: { type: Schema.Types.Mixed, default: {} },
    stage: {
      type: String,
      enum: ["hot", "meeting scheduled", "meeting done", "opportunity"],
      default: "hot",
      index: true,
    },
    solution: {
      type: String,
      enum: ["risk", "cyber training", "cyber advisory"],
      default: "risk",
      index: true,
    },
    notes: [pipelineNoteSchema],
  },
  { timestamps: true, minimize: false }
)

// Virtuals for common display values derived from data
function pickFirst(obj: any, keys: string[]): any {
  const normalize = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "")
  for (const k of keys) {
    if (!obj) continue
    // direct
    const direct = obj[k]
    if (direct !== undefined && direct !== null && String(direct).trim() !== "") return direct
    // case-insensitive
    const ciKey = Object.keys(obj).find((x) => x.toLowerCase() === String(k).toLowerCase())
    if (ciKey && obj[ciKey] !== undefined && obj[ciKey] !== null && String(obj[ciKey]).trim() !== "") return obj[ciKey]
    // normalized (ignore spaces/underscores/dashes and punctuation)
    const nk = normalize(k)
    const normKey = Object.keys(obj).find((x) => normalize(x) === nk)
    if (normKey && obj[normKey] !== undefined && obj[normKey] !== null && String(obj[normKey]).trim() !== "") return obj[normKey]
  }
  return undefined
}

pipelineSchema.virtual('meta').get(function(this: any) {
  const d = this?.data || {}
  const first = pickFirst(d, ['first_name','firstName'])
  const last = pickFirst(d, ['last_name','lastName'])
  const contact = pickFirst(d, ['contact_name','contactName','name'])
  const title = pickFirst(d, ['title','designation'])
  const company = pickFirst(d, ['company_name','account_name','company','companyName'])
  const email = pickFirst(d, ['email','email_id'])
  const phone = pickFirst(d, ['phone','personal_phone','contact_number_personal'])
  const website = pickFirst(d, ['website'])
  const industry = pickFirst(d, ['industry','industry_client','industry_nexuses'])
  const fullName = (first || last) ? `${first || ''} ${last || ''}`.trim() : (contact || '')
  return { fullName, title, company, email, phone, website, industry }
})

pipelineSchema.set('toJSON', { virtuals: true })
pipelineSchema.set('toObject', { virtuals: true })

export const Pipeline = models.Pipeline || mongoose.model<IPipeline>("Pipeline", pipelineSchema)


