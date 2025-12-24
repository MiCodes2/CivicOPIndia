import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ embeddable: false }, { status: 400 });

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(id)}&format=json`;
    const res = await fetch(oembedUrl, { method: 'GET' });
    if (!res.ok) {
      return NextResponse.json({ embeddable: false }, { status: 200 });
    }
    // If oEmbed returns OK, video is embeddable
    return NextResponse.json({ embeddable: true });
  } catch (e: any) {
    return NextResponse.json({ embeddable: false }, { status: 500 });
  }
}
