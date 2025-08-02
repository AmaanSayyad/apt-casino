import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const playbackId = searchParams.get("playbackId");
    if (!playbackId) {
      return NextResponse.json({ error: "playbackId is required" }, { status: 400 });
    }

    // Ignore full URLs; this endpoint expects a Livepeer playbackId only
    if (/^https?:\/\//i.test(playbackId)) {
      return NextResponse.json({ error: "playbackId must not be a full URL" }, { status: 400 });
    }

    const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "LIVEPEER_API_KEY is not configured" }, { status: 500 });
    }

    // Livepeer Metrics API: sessions by playbackId (approximate example)
    // Docs evolve; adjust endpoint/fields as needed.
    const url = `https://livepeer.studio/api/metrics/viewership?playbackId=${encodeURIComponent(playbackId)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Upstream error: ${text}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


