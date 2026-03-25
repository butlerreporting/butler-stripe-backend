import Stripe from "stripe";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.butlerreporting.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { clientName, email, invoiceNumber, baseAmount, totalAmount } = req.body || {};

    const base = Number(baseAmount);
    if (!Number.isFinite(base) || base <= 0) {
      return res.status(400).json({ error: "Invalid invoice amount." });
    }

    const fee = +(base * 0.035).toFixed(2);
    const total = +(base + fee).toFixed(2);

    if (totalAmount && Math.abs(total - Number(totalAmount)) > 0.01) {
      return res.status(400).json({ error: "Payment amount mismatch." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: invoiceNumber,
      success_url: "https://www.butlerreporting.com/payment-success",
      cancel_url: "https://www.butlerreporting.com/submit-payment",
      metadata: {
        client_name: clientName || "",
        invoice_number: invoiceNumber || "",
        base_amount: base.toFixed(2),
        fee_amount: fee.toFixed(2),
        fee_rate: "3.5%"
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice Payment #${invoiceNumber || "Invoice"}`
            },
            unit_amount: Math.round(total * 100)
          },
          quantity: 1
        }
      ]
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
