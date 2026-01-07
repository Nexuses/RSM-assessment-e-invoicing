import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { DataRequest } from "@/lib/models/dataRequest"
import { getCurrentUser } from "@/lib/auth"
import mongoose from "mongoose"

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    // For admin, fetch all data requests without filtering by userId
    const dataRequests = await DataRequest.find()
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(dataRequests)
  } catch (error) {
    console.error("Error fetching data requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { id, status } = data

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 })
    }

    await connectToDatabase()
    const updatedRequest = await DataRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )

    if (!updatedRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error("Error updating data request status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 