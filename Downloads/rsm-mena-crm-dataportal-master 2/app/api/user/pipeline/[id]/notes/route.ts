import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import { Pipeline } from "@/lib/models/pipeline"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { comment, category } = await request.json()
    if (!comment || !comment.trim()) return NextResponse.json({ error: "comment required" }, { status: 400 })
    const allowed = new Set(["call","note","email","meeting"])
    const cat = typeof category === 'string' && allowed.has(category.toLowerCase()) ? category.toLowerCase() : 'note'

    await connectToDatabase()
    const { id } = await context.params
    const pipeline = await Pipeline.findOne({ _id: id, userId: session.id })
    if (!pipeline) return NextResponse.json({ error: "Not found" }, { status: 404 })

    pipeline.notes.push({ authorId: session.id, comment, createdAt: new Date(), category: cat })
    await pipeline.save()

    const reloaded = await Pipeline.findById(id)
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
    console.error("Error adding note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


