import { sql } from "@/lib/db";

export async function GET() {
  try {
    const items = await sql`
      SELECT
        id,
        name,
        category,
        image_url
      FROM items
      ORDER BY created_at ASC
    `;

    return Response.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to fetch items",
      },
      { status: 500 }
    );
  }
}