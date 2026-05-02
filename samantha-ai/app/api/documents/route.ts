import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let i = 1;

    if (search) {
      conditions.push(
        `(d.document_subject ILIKE $${i} OR p.full_name ILIKE $${i} OR d.file_name ILIKE $${i})`,
      );
      params.push(`%${search}%`);
      i++;
    }
    if (categoryId) {
      conditions.push(`d.category_id = $${i}`);
      params.push(categoryId);
      i++;
    }
    if (dateFrom) {
      conditions.push(`d.date_of_report >= $${i}`);
      params.push(dateFrom);
      i++;
    }
    if (dateTo) {
      conditions.push(`d.date_of_report <= $${i}`);
      params.push(dateTo);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*)
       FROM documents d
       LEFT JOIN patients p ON d.patient_id = p.id
       ${where}`,
      params,
    );

    const result = await pool.query(
      `SELECT
         d.id,
         d.file_name,
         d.s3_key,
         d.created_at,
         d.document_subject,
         d.date_of_report,
         d.doctor_name,
         c.name AS category_name,
         p.full_name AS patient_name
       FROM documents d
       LEFT JOIN patients p ON d.patient_id = p.id
       LEFT JOIN categories c ON d.category_id = c.id
       ${where}
       ORDER BY d.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset],
    );

    return NextResponse.json({
      success: true,
      documents: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
