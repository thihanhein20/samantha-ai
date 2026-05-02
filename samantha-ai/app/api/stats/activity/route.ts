import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT DATE(created_at) AS date, COUNT(*)::int AS count
      FROM documents
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Build a full 7-day series, filling missing days with 0
    const map: Record<string, number> = {};
    for (const row of result.rows) {
      map[row.date.toISOString().split("T")[0]] = row.count;
    }

    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push({
        date: key,
        label: d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric" }),
        count: map[key] ?? 0,
      });
    }

    return NextResponse.json({ success: true, days });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
