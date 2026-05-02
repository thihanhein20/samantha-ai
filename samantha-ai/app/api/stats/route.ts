import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM patients)                                              AS total_patients,
        (SELECT COUNT(*) FROM documents)                                             AS total_documents,
        (SELECT COUNT(*) FROM documents WHERE created_at >= NOW() - INTERVAL '7 days') AS this_week
    `);

    const row = result.rows[0];
    return NextResponse.json({
      success: true,
      stats: {
        total_patients: parseInt(row.total_patients, 10),
        total_documents: parseInt(row.total_documents, 10),
        this_week: parseInt(row.this_week, 10),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
