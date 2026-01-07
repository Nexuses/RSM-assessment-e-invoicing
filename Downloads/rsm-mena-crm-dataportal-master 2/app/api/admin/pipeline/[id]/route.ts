import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { isAdmin } from "@/lib/auth"
import { Pipeline } from "@/lib/models/pipeline"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    await connectToDatabase()
    const deleted = await Pipeline.findByIdAndDelete(params.id)
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    console.error("Error deleting pipeline item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


