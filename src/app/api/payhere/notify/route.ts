import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData);

    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
    } = data;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || "MTY5NjYxNjM3MDI5NjYyODAxMTQzMjkzNjU5MjgxMjg4MzAzMTUw";

    // Verify the signature for security
    const hashedSecret = crypto
      .createHash("md5")
      .update(merchantSecret)
      .digest("hex")
      .toUpperCase();

    const localHash = crypto
      .createHash("md5")
      .update(String(merchant_id) + String(order_id) + String(payhere_amount) + String(payhere_currency) + String(status_code) + hashedSecret)
      .digest("hex")
      .toUpperCase();

    // Check if the hash matches and the status is '2' (Success)
    if (localHash === md5sig && status_code === "2") {
      await dbConnect();

      // Extract userId from order_id (e.g., "QZ_USERID_TIMESTAMP")
      const parts = (order_id as string).split("_");
      const userId = parts[1];

      if (userId) {
        // Assume payment of LKR 100 adds 10 credits (you can adjust this logic)
        const creditAmount = Math.floor(parseFloat(payhere_amount as string) / 10);
        
        await User.findByIdAndUpdate(userId, {
          $inc: { credits: creditAmount }
        });

        console.log(`Payment confirmed: ${creditAmount} credits added to User ${userId}`);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("PayHere Notification Error:", error);
    return new Response("Error", { status: 500 });
  }
}
