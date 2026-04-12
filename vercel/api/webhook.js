/**
 * Dodo Payments Webhook Handler
 * Receives payment events and stores license info
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    console.log('[Webhook] Received:', event.type, event.data);

    // Handle successful payment (Dodo uses 'payment.succeeded')
    if (event.type === 'payment.succeeded' || event.type === 'payment_intent.succeeded') {
      const { customer, license_key, product } = event.data;
      
      console.log('[Webhook] Payment success:', {
        email: customer?.email,
        license: license_key,
        product: product?.name
      });

      // License key is automatically sent by Dodo
      // You can add custom logic here (e.g., send to your own DB)
    }

    // Handle license created
    if (event.type === 'license.created' || event.type === 'license.activated') {
      console.log('[Webhook] License created:', event.data);
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('[Webhook] Error:', err);
    // Always return 200 to Dodo so they don't retry
    return res.status(200).json({ received: true, error: err.message });
  }
}
