import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import { Pipeline } from "@/lib/models/pipeline"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET user's own pipeline
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()
    const items = await Pipeline.find({ userId: session.id })
      .populate({ path: 'notes.authorId', select: 'email' })
      .sort({ updatedAt: -1 })
      .lean({ virtuals: true })
      .exec()

    const mapped = items.map((it: any) => ({
      ...it,
      meta: it.meta || ({} as any),
      notes: (it.notes || []).map((n: any) => ({
        ...n,
        authorEmail: n?.authorId?.email,
        authorId: n?.authorId?._id || n?.authorId
      }))
    }))
    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error fetching user pipeline:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH to update stage/solution by id
export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { _id, stage, solution } = await request.json()
    if (!_id || (!stage && !solution)) return NextResponse.json({ error: "_id and at least one of stage or solution is required" }, { status: 400 })

    await connectToDatabase()
    const toSet: any = {}
    if (stage) toSet.stage = stage
    if (solution) toSet.solution = solution
    const updated = await Pipeline.findOneAndUpdate({ _id, userId: session.id }, { $set: toSet }, { new: true })
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Reload with virtuals & populated notes for a consistent client shape
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
    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error updating stage/solution:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


