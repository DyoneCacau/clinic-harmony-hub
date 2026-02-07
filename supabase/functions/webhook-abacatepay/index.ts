import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  event: 'billing.paid' | 'pix.paid' | 'pix.expired' | 'withdraw.paid';
  data: {
    id: string;
    amount: number;
    status: string;
    metadata?: {
      plan_id?: string;
      user_id?: string;
      clinic_id?: string;
    };
    customer?: {
      id: string;
      metadata: {
        name: string;
        email: string;
        cellphone: string;
        taxId: string;
      };
    };
    products?: Array<{
      id: string;
      externalId: string;
      quantity: number;
    }>;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload = await req.json() as WebhookPayload
    
    console.log('Webhook received:', JSON.stringify(payload, null, 2))

    switch (payload.event) {
      case 'billing.paid':
        await handleBillingPaid(supabase, payload)
        break
      case 'pix.paid':
        await handlePixPaid(supabase, payload)
        break
      case 'pix.expired':
        await handlePixExpired(supabase, payload)
        break
      default:
        console.log('Unhandled event:', payload.event)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleBillingPaid(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload
) {
  const { data } = payload
  
  // Get plan_id from products
  const planId = data.products?.[0]?.externalId
  
  if (!planId) {
    console.error('No plan ID found in billing data')
    return
  }

  // Find the clinic by customer email
  const customerEmail = data.customer?.metadata?.email
  
  if (!customerEmail) {
    console.error('No customer email found')
    return
  }

  // Find clinic by owner email
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('email', customerEmail)
    .maybeSingle()

  if (!clinic) {
    console.error('Clinic not found for email:', customerEmail)
    return
  }

  await activateSubscription(supabase, clinic.id, planId, data.id)
}

async function handlePixPaid(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload
) {
  const { data } = payload
  
  // Get metadata from PIX payment
  const planId = data.metadata?.plan_id
  const clinicId = data.metadata?.clinic_id
  
  if (!planId || !clinicId) {
    console.error('Missing plan_id or clinic_id in PIX metadata')
    
    // Try to find from payment_history using the PIX ID
    const { data: paymentHistory } = await supabase
      .from('payment_history')
      .select('*, subscriptions(clinic_id)')
      .ilike('notes', `%${data.id}%`)
      .maybeSingle()

    if (paymentHistory) {
      const subscription = paymentHistory.subscriptions as any
      await activateSubscription(
        supabase, 
        subscription?.clinic_id || paymentHistory.clinic_id, 
        paymentHistory.requested_plan_id,
        data.id
      )
    }
    return
  }

  await activateSubscription(supabase, clinicId, planId, data.id)
}

async function handlePixExpired(
  supabase: ReturnType<typeof createClient>,
  payload: WebhookPayload
) {
  const { data } = payload
  
  // Update payment_history to expired
  await supabase
    .from('payment_history')
    .update({ status: 'expired' })
    .ilike('notes', `%${data.id}%`)
}

async function activateSubscription(
  supabase: ReturnType<typeof createClient>,
  clinicId: string,
  planId: string,
  paymentReference: string
) {
  // Calculate next billing period (30 days from now)
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setDate(periodEnd.getDate() + 30)

  // Update subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      plan_id: planId,
      status: 'active',
      payment_status: 'paid',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      last_payment_at: now.toISOString(),
      trial_ends_at: null, // Clear trial
      updated_at: now.toISOString(),
    })
    .eq('clinic_id', clinicId)

  if (subError) {
    console.error('Error updating subscription:', subError)
    return
  }

  // Update payment_history to confirmed
  await supabase
    .from('payment_history')
    .update({
      status: 'confirmed',
      confirmed_at: now.toISOString(),
    })
    .ilike('notes', `%${paymentReference}%`)

  // Create admin notification
  const { data: clinic } = await supabase
    .from('clinics')
    .select('name')
    .eq('id', clinicId)
    .single()

  const { data: plan } = await supabase
    .from('plans')
    .select('name')
    .eq('id', planId)
    .single()

  await supabase
    .from('admin_notifications')
    .insert({
      title: 'Novo pagamento confirmado',
      message: `A clínica "${clinic?.name}" ativou o plano "${plan?.name}" via AbacatePay`,
      type: 'payment',
      reference_type: 'subscription',
      reference_id: clinicId,
    })

  console.log(`Subscription activated for clinic ${clinicId} with plan ${planId}`)
}
