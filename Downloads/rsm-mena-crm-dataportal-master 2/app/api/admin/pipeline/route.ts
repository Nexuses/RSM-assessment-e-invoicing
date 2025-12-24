import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { isAdmin } from "@/lib/auth"
import { Pipeline } from "@/lib/models/pipeline"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/pipeline?userId=...
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    await connectToDatabase()

    const query: any = {}
    if (userId) query.userId = userId

    const items = await Pipeline.find(query)
      .populate({ path: 'notes.authorId', select: 'email' })
      .sort({ updatedAt: -1 })
      .lean({ virtuals: true })
      .exec()

    // Map notes to include authorEmail plainly
    const mapped = items.map((it: any) => ({
      ...it,
      // Ensure meta field exists for clients
      meta: it.meta || ({} as any),
      notes: (it.notes || []).map((n: any) => ({
        ...n,
        authorEmail: n?.authorId?.email,
        authorId: n?.authorId?._id || n?.authorId
      }))
    }))
    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error fetching pipeline:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/pipeline -> create or update by _id
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const body = await request.json()
    console.log('[PIPELINE_POST] incoming payload', JSON.stringify(body))
    await connectToDatabase()

    if (body._id) {
      // Only set fields that are explicitly provided to avoid wiping values with undefined
      const toSet: any = {}
      if (Object.prototype.hasOwnProperty.call(body, 'userId')) toSet.userId = body.userId
      if (Object.prototype.hasOwnProperty.call(body, 'stage')) toSet.stage = body.stage
      if (Object.prototype.hasOwnProperty.call(body, 'solution')) toSet.solution = body.solution
      if (Object.prototype.hasOwnProperty.call(body, 'data')) toSet.data = body.data || {}

      const updated = await Pipeline.findByIdAndUpdate(
        body._id,
        { $set: toSet },
        { new: true, runValidators: false }
      )
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })

      // Reload with lean & virtuals for a consistent shape and map notes
      const reloaded = await Pipeline.findById(updated._id)
        .populate({ path: 'notes.authorId', select: 'email' })
        .lean({ virtuals: true })
        .exec()
      if (!reloaded) return NextResponse.json({ error: "Not found" }, { status: 404 })
      const mapped: any = {
        ...reloaded,
        meta: (reloaded as any).meta || ({} as any),
        notes: ((reloaded as any).notes || []).map((n: any) => ({
          ...n,
          authorEmail: n?.authorId?.email,
          authorId: n?.authorId?._id || n?.authorId
        }))
      }
      console.log('[PIPELINE_POST] updated saved', JSON.stringify(mapped))
      return NextResponse.json(mapped)
    }

    if (!body.userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })
    const created = await Pipeline.create({ userId: body.userId, stage: body.stage, solution: body.solution, data: body.data || {} })

    // Load the created doc with lean & virtuals
    const reloaded = await Pipeline.findById(created._id)
      .populate({ path: 'notes.authorId', select: 'email' })
      .lean({ virtuals: true })
      .exec()
    const mapped: any = reloaded ? {
      ...reloaded,
      meta: (reloaded as any).meta || ({} as any),
      notes: ((reloaded as any).notes || []).map((n: any) => ({
        ...n,
        authorEmail: n?.authorId?.email,
        authorId: n?.authorId?._id || n?.authorId
      }))
    } : created.toJSON()

    console.log('[PIPELINE_POST] created saved', JSON.stringify(mapped))
    return NextResponse.json(mapped, { status: 201 })
  } catch (error) {
    console.error("Error saving pipeline:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


