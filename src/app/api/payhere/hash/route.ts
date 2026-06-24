import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, currency } = await req.json();

    // 1. Get credentials from environment variables (fallback to 1234862)
    const merchantId = process.env.PAYHERE_MERCHANT_ID || "1234862";
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || "";

    if (!merchantSecret) {
      console.warn("PAYHERE_MERCHANT_SECRET is not set in environment variables!");
    }

    // 2. MD5 of the Merchant Secret (Uppercase)
    const hashedSecret = crypto
      .createHash("md5")
      .update(merchantSecret)
      .digest("hex")
      .toUpperCase();

    // 3. Format amount exactly as sent by the frontend (2 decimal places)
    const amountFormatted = parseFloat(amount.toString()).toFixed(2);

    // 4. Create the final MD5 hash string
    const hashStr = merchantId + orderId + amountFormatted + currency + hashedSecret;
    const hash = crypto
      .createHash("md5")
      .update(hashStr)
      .digest("hex")
      .toUpperCase();

    console.log(`RESORED HASH: Order:${orderId}, Amount:${amountFormatted}, Hash:${hash}`);

    return NextResponse.json({ hash });
  } catch (error) {
    console.error("Hash generation error:", error);
    return NextResponse.json({ error: "Hash generation failed" }, { status: 500 });
  }
}
