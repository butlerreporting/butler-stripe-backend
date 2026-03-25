import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { clientName, email, invoiceNumber, baseAmount } = req.body;

    const base = Number(baseAmount);
    const fee = +(base * 0.035).toFixed(2);
    const total = +(base + fee).toFixed(2);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: invoiceNumber,
      success_url: "https://www.YOURDOMAIN.com/payment-success",
      cancel_url: "https://www.YOURDOMAIN.com/pay",
      metadata: {
        client_name: clientName,
        invoice_number: invoiceNumber,
        base_amount: base.toFixed(2),
        fee_amount: fee.toFixed(2),
        fee_rate: "3.5%"
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice Payment #${invoiceNumber}`,
            },
            unit_amount: Math.round(total * 100),
          },
          quantity: 1,
        },
      ],
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
