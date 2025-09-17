import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `oEmbed error: ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    // Return essential fields only
    return NextResponse.json({
      title: data.title,
      author_name: data.author_name,
      author_url: data.author_url,
      provider_name: data.provider_name,
      thumbnail_url: data.thumbnail_url || null,
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


