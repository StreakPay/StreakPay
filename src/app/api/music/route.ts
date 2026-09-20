import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: activities, error } = await supabase
      .from("music_activities")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({
        activities: [
          { id: "1", title: "Music Quiz: Afrobeats Classics", description: "Test your knowledge of Afrobeats hits", type: "quiz", reward: 100 },
          { id: "2", title: "Discover: Emerging Artists", description: "Discover 5 new artists this week", type: "discovery", reward: 200 },
          { id: "3", title: "Challenge: 30-Day Playlist", description: "Create a 30-day workout playlist", type: "challenge", reward: 500 },
        ],
      });
    }

    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
