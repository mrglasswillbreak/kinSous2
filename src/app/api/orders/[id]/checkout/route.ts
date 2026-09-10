import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkout, orderForUser } from "@/lib/payments";
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const order = await orderForUser(id, session.userId);
    if (!order || order.seeker_id !== session.userId)
      return NextResponse.json(
        { error: "Only the customer can pay" },
        { status: 403 },
      );
    if (!session.email)
      return NextResponse.json(
        { error: "Add an email address before paying" },
        { status: 400 },
      );
    return NextResponse.json({
      url: await checkout(order, session.email, session.name),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Checkout unavailable",
      },
      { status: 409 },
    );
  }
}
