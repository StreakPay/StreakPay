import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({
        activities: [
          { id: "1", title: "Music Quiz: Afrobeats Classics", description: "Test your knowledge of Afrobeats hits", type: "quiz", reward: 100 },
          { id: "2", title: "Discover: Emerging Artists", description: "Discover 5 new artists this week", type: "discovery", reward: 200 },
          { id: "3", title: "Challenge: 30-Day Playlist", description: "Create a 30-day workout playlist", type: "challenge", reward: 500 },
        ],
      });
    }

    const activities = await db.musicActivity.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
