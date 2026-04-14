import Stripe from "stripe";

export default async function handler(req, res) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).send("Missing STRIPE_SECRET_KEY");
    }

    if (!process.env.BASE_URL) {
      return res.status(500).send("Missing BASE_URL");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { amount, invoice, name, email } = req.query;

    if (!name || String(name).trim() === "") {
      return res.status(400).send("Missing payer name");
    }

    if (!email || String(email).trim() === "") {
      return res.status(400).send("Missing payer email");
    }

    if (!invoice || String(invoice).trim() === "") {
      return res.status(400).send("Missing invoice number");
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).send("Invalid amount");
    }

    const unitAmount = Math.round(Number(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["us_bank_account"],
      customer_email: email,
      billing_address_collection: "required",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice #${invoice} - ${name}`,
              description: "ACH invoice payment",
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.BASE_URL}/payment-success`,
      cancel_url: `${process.env.BASE_URL}/payment-cancelled`,
      metadata: {
        invoice_number: invoice,
        payer_name: name,
        payer_email: email,
        payment_method: "ACH",
      },
    });

    return res.redirect(303, session.url);
  } catch (err) {
    console.error("Checkout error:", err);
    return res
      .status(500)
      .send(`Error creating checkout session: ${err.message}`);
  }
}
