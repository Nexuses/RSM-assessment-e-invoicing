import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { DataFile, type IDataFile } from "@/lib/models/dataFile"
import { User, type IUser } from "@/lib/models/user"
import { getCurrentUser } from "@/lib/auth"
import mongoose from "mongoose"
import { DataRequest } from "@/lib/models/dataRequest"
import { ensureIndexes } from "@/lib/utils"

interface PopulatedDataFile extends Omit<IDataFile, "_id"> {
  _id: mongoose.Types.ObjectId
}

interface PopulatedUserDataFile {
  fileId: PopulatedDataFile
  title: string
  createdAt: Date
}

interface PopulatedUser extends Omit<IUser, "dataFiles"> {
  dataFiles: PopulatedUserDataFile[]
}

interface LegacyUser extends Omit<IUser, "dataFiles"> {
  dataFileId: mongoose.Types.ObjectId
}

// Enable Next.js Edge Runtime caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cache for user data to reduce database queries
const userDataCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Helper function to ensure indexes if they don't exist
async function ensureAllIndexes() {
  await Promise.all([
    ensureIndexes(User.collection, [
      { fields: { email: 1 } }
    ]),
    ensureIndexes(DataRequest.collection, [
      { fields: { userId: 1 } }
    ])
  ]);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user ID for cache key
    const userId = session.id || session.email || 'unknown';
    
    // Check if the client is requesting fresh data
    const url = new URL(request.url);
    const forceFresh = url.searchParams.has('fresh');
    
    // Check if we have cached data for this user
    if (!forceFresh && userDataCache.has(userId)) {
      const cachedData = userDataCache.get(userId);
      
      // If cache is still valid, return it
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
        console.log("Returning cached data for user:", userId);
        return NextResponse.json(cachedData.data, {
          status: 200,
          headers: {
            'Cache-Control': 'private, max-age=300',
            'X-Cache': 'HIT',
            'X-Cache-Time': new Date(cachedData.timestamp).toISOString()
          }
        });
      }
    }

    await connectToDatabase();
    
    // Ensure indexes exist for better query performance
    await ensureAllIndexes();
    
    // Run these queries in parallel
    const [requestCount, user] = await Promise.all([
      // Get user's data requests count
      DataRequest.countDocuments({ userId: session.id }),
      
      // Find user by ID or email
      findUserWithData(session)
    ]);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    try {
      // Handle users with no data files gracefully
      if (!user.dataFiles || user.dataFiles.length === 0) {
        const response = {
          title: user.title || "Data Dashboard",
          credits: user.credits || 0,
          requestCount: requestCount || 0,
          totalFiles: 0,
          userId: userId,
          timestamp: Date.now(),
          dataFiles: [],
        };

        // Cache the response
        userDataCache.set(userId, {
          data: response,
          timestamp: Date.now()
        });

        // Return the response with empty data files
        return NextResponse.json(response, {
          status: 200,
          headers: {
            'Cache-Control': 'private, max-age=300',
            'X-Cache': 'MISS',
            'Vary': 'Authorization'
          }
        });
      }

      // Clean up missing file references if needed
      const hasMissingFiles = user.dataFiles.some(file => !file.fileId);
      if (hasMissingFiles) {
        try {
          // Get the actual user document (not lean) so we can update it
          const userDoc = await User.findById(user._id);
          if (userDoc && userDoc.dataFiles) {
            // Filter out missing file references
            userDoc.dataFiles = userDoc.dataFiles.filter(file => 
              file && file.fileId && file.fileId.toString()
            );
            await userDoc.save();
            
            // Update our local copy for the response
            user.dataFiles = user.dataFiles.filter(file => file.fileId);
          }
        } catch (err) {
          console.error("Error cleaning up file references:", err);
          // Continue with the user data we have
        }
      }

      // Process the data files more efficiently
      const validDataFiles = user.dataFiles.filter(file => file && file.fileId);
      
      const response = {
        title: user.title || "Data Dashboard",
        credits: user.credits || 0,
        requestCount: requestCount || 0,
        totalFiles: validDataFiles.length,
        userId: userId,
        timestamp: Date.now(),
        dataFiles: validDataFiles.map((file) => {
          try {
            return {
              id: file.fileId._id.toString(),
              title: file.title || "Untitled",
              filename: file.fileId.originalName || "Unknown",
              columns: Array.isArray(file.fileId.columns) ? file.fileId.columns : [],
              data: Array.isArray(file.fileId.data) ? file.fileId.data : [],
            }
          } catch (err) {
            console.error("Error processing file data:", err);
            return {
              id: "error",
              title: file.title || "Error",
              filename: "Error processing file",
              columns: [],
              data: [],
            }
          }
        }),
      };

      // Cache the response
      userDataCache.set(userId, {
        data: response,
        timestamp: Date.now()
      });

      // Return the response with cache control headers
      return NextResponse.json(response, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=300',
          'X-Cache': 'MISS',
          'Vary': 'Authorization'
        }
      });
    } catch (error) {
      console.error("Error processing user data:", error);
      return NextResponse.json({ error: "Error processing user data" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to find user with data
async function findUserWithData(session: any): Promise<PopulatedUser | null> {
  let user: PopulatedUser | null = null;
  
  // Try to find by ID first
  if (session.id) {
    try {
      user = await getUserById(session.id);
    } catch (error) {
      // ID lookup failed, try email
    }
  }
  
  // If no user found by ID and we have an email, try by email
  if (!user && session.email) {
    user = await getUserByEmail(session.email);
  }
  
  return user;
}

// Helper function to get user by ID
async function getUserById(userId: string): Promise<PopulatedUser | null> {
  try {
    const foundUser = await User.findOne<IUser>({ 
      _id: new mongoose.Types.ObjectId(userId) 
    })
    .populate({
      path: "dataFiles.fileId",
      model: DataFile,
      select: 'filename originalName data columns'
    })
    .lean()
    .exec();
    
    if (!foundUser) return null;
    
    const user = foundUser as unknown as PopulatedUser;
    
    // Handle legacy schema migration if needed
    return await handleLegacyUser(foundUser);
  } catch (error) {
    return null;
  }
}

// Helper function to get user by email
async function getUserByEmail(email: string): Promise<PopulatedUser | null> {
  try {
    const foundUser = await User.findOne<IUser>({ email })
      .populate({
        path: "dataFiles.fileId",
        model: DataFile,
        select: 'filename originalName data columns'
      })
      .lean()
      .exec();
    
    if (!foundUser) return null;
    
    // Handle legacy schema migration if needed
    return await handleLegacyUser(foundUser);
  } catch (error) {
    return null;
  }
}

// Helper function to handle legacy user schema migration
async function handleLegacyUser(foundUser: any): Promise<PopulatedUser | null> {
  const user = foundUser as unknown as PopulatedUser;
  
  // Check if user has old schema (dataFileId)
  const legacyUser = foundUser as unknown as LegacyUser;
  if (legacyUser && 'dataFileId' in legacyUser && !('dataFiles' in legacyUser)) {
    const dataFile = await DataFile.findById(legacyUser.dataFileId)
      .select('filename originalName data columns');
      
    if (dataFile) {
      // Update user to new schema
      await User.findByIdAndUpdate(legacyUser._id, {
        $set: {
          dataFiles: [{
            fileId: dataFile._id,
            title: dataFile.filename || "Untitled",
            createdAt: new Date()
          }]
        },
        $unset: {
          dataFileId: ""
        }
      });
      
      // Return updated user data
      user.dataFiles = [{
        fileId: dataFile as unknown as PopulatedDataFile,
        title: dataFile.filename || "Untitled",
        createdAt: new Date()
      }];
    }
  }
  
  return user;
}

