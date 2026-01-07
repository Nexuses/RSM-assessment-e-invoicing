import mongoose, { Schema, models } from "mongoose"

export interface IDataFile extends mongoose.Document {
  filename: string
  originalName: string
  columns: string[]
  data: Array<{
    [key: string]: string // Allow any field name as string key
  }>
  createdAt: Date
  updatedAt: Date
}

// Create a more flexible schema that will accept dynamic field names
const dataFileSchema = new Schema<IDataFile>(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    columns: {
      type: [String],
      required: true,
    },
    // Instead of defining all possible fields, use Schema.Types.Mixed
    // to create a more flexible schema that accepts any fields
    data: [{
      type: mongoose.Schema.Types.Mixed,
      default: {},
      _id: false
    }],
  },
  { 
    timestamps: true,
    // Setting strict false allows saving fields not explicitly defined in the schema
    strict: false
  },
)

export const DataFile = models.DataFile || mongoose.model<IDataFile>("DataFile", dataFileSchema)

