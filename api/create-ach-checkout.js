const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  try {
    const { amount, invoice } = req.query;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).send('Invalid amount.');
    }

    const unitAmount = Math.round(Number(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['us_bank_account'], // 👈 THIS is the magic
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'ACH Invoice Payment',
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.BASE_URL}/payment-success`,
      cancel_url: `${process.env.BASE_URL}/payment-cancelled`,
      metadata: {
        invoice_number: invoice || '',
        payment_method: 'ACH',
      },
    });

    return res.redirect(303, session.url);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error creating checkout session.');
  }
};
