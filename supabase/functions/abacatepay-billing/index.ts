import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v1'

interface CreateBillingRequest {
  plan_id: string;
  user_id: string;
  payment_method: 'PIX' | 'CARD';
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  cpf?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const abacatePayKey = Deno.env.get('ABACATEPAY_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    if (req.method === 'POST' && action === 'create') {
      return await handleCreateBilling(req, supabase, abacatePayKey)
    }

    if (req.method === 'GET' && action === 'check') {
      return await handleCheckBilling(req, supabase, abacatePayKey)
    }

    if (req.method === 'POST' && action === 'pix') {
      return await handleCreatePixQrCode(req, supabase, abacatePayKey)
    }

    if (req.method === 'GET' && action === 'pix-status') {
      return await handleCheckPixStatus(req, abacatePayKey)
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleCreateBilling(
  req: Request, 
  supabase: ReturnType<typeof createClient>,
  apiKey: string
) {
  const { plan_id, user_id, payment_method } = await req.json() as CreateBillingRequest

  // Get user profile and clinic data
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, phone')
    .eq('user_id', user_id)
    .single()

  if (!profile) {
    return new Response(
      JSON.stringify({ error: 'User profile not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get clinic data for CPF/CNPJ
  const { data: clinicUser } = await supabase
    .from('clinic_users')
    .select('clinic_id')
    .eq('user_id', user_id)
    .single()

  const { data: clinic } = await supabase
    .from('clinics')
    .select('name, cnpj, phone')
    .eq('id', clinicUser?.clinic_id)
    .single()

  // Get plan details
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', plan_id)
    .single()

  if (!plan) {
    return new Response(
      JSON.stringify({ error: 'Plan not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create or get AbacatePay customer
  const customerResponse = await fetch(`${ABACATEPAY_API_URL}/customer/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      name: profile.name || clinic?.name || 'Cliente',
      email: profile.email,
      cellphone: profile.phone || clinic?.phone || '(00) 00000-0000',
      taxId: clinic?.cnpj || '000.000.000-00',
    }),
  })

  const customerData = await customerResponse.json()
  
  if (customerData.error) {
    console.error('AbacatePay customer error:', customerData.error)
    // Continue even if customer creation fails, AbacatePay will create inline
  }

  const customerId = customerData.data?.id

  // Get the return URL from environment or use a default
  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')
  const returnUrl = `${baseUrl}/configuracoes?payment=pending`
  const completionUrl = `${baseUrl}/configuracoes?payment=success`

  // Create billing
  const priceInCents = Math.round(plan.price_monthly * 100)
  
  const billingPayload = {
    frequency: 'ONE_TIME',
    methods: [payment_method],
    products: [{
      externalId: plan.id,
      name: plan.name,
      description: plan.description || `Assinatura ${plan.name}`,
      quantity: 1,
      price: priceInCents,
    }],
    returnUrl: returnUrl,
    completionUrl: completionUrl,
    ...(customerId ? { customerId } : {
      customer: {
        name: profile.name || 'Cliente',
        email: profile.email,
        cellphone: profile.phone || '(00) 00000-0000',
        taxId: clinic?.cnpj || '000.000.000-00',
      }
    }),
  }

  const billingResponse = await fetch(`${ABACATEPAY_API_URL}/billing/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(billingPayload),
  })

  const billingData = await billingResponse.json()

  if (billingData.error) {
    console.error('AbacatePay billing error:', billingData.error)
    return new Response(
      JSON.stringify({ error: 'Failed to create billing', details: billingData.error }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('clinic_id', clinicUser?.clinic_id)
    .single()

  // Record payment attempt in payment_history
  if (subscription) {
    await supabase
      .from('payment_history')
      .insert({
        subscription_id: subscription.id,
        clinic_id: clinicUser?.clinic_id,
        amount: plan.price_monthly,
        status: 'pending',
        payment_method: payment_method.toLowerCase(),
        requested_plan_id: plan_id,
        notes: `AbacatePay billing ID: ${billingData.data.id}`,
      })
  }

  return new Response(
    JSON.stringify({
      success: true,
      billing_id: billingData.data.id,
      checkout_url: billingData.data.url,
      amount: billingData.data.amount,
      status: billingData.data.status,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCreatePixQrCode(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  apiKey: string
) {
  const { plan_id, user_id } = await req.json()

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, phone')
    .eq('user_id', user_id)
    .single()

  // Get clinic data
  const { data: clinicUser } = await supabase
    .from('clinic_users')
    .select('clinic_id')
    .eq('user_id', user_id)
    .single()

  const { data: clinic } = await supabase
    .from('clinics')
    .select('name, cnpj, phone')
    .eq('id', clinicUser?.clinic_id)
    .single()

  // Get plan details
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', plan_id)
    .single()

  if (!plan) {
    return new Response(
      JSON.stringify({ error: 'Plan not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const priceInCents = Math.round(plan.price_monthly * 100)

  // Create PIX QR Code directly
  const pixResponse = await fetch(`${ABACATEPAY_API_URL}/pixQrCode/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      amount: priceInCents,
      expiresIn: 3600, // 1 hour
      description: `Assinatura ${plan.name}`,
      customer: {
        name: profile?.name || 'Cliente',
        email: profile?.email || '',
        cellphone: profile?.phone || clinic?.phone || '(00) 00000-0000',
        taxId: clinic?.cnpj || '000.000.000-00',
      },
      metadata: {
        plan_id: plan_id,
        user_id: user_id,
        clinic_id: clinicUser?.clinic_id,
      },
    }),
  })

  const pixData = await pixResponse.json()

  if (pixData.error) {
    console.error('AbacatePay PIX error:', pixData.error)
    return new Response(
      JSON.stringify({ error: 'Failed to create PIX QR Code', details: pixData.error }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get subscription and record payment attempt
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('clinic_id', clinicUser?.clinic_id)
    .single()

  if (subscription) {
    await supabase
      .from('payment_history')
      .insert({
        subscription_id: subscription.id,
        clinic_id: clinicUser?.clinic_id,
        amount: plan.price_monthly,
        status: 'pending',
        payment_method: 'pix',
        requested_plan_id: plan_id,
        notes: `AbacatePay PIX ID: ${pixData.data.id}`,
      })
  }

  return new Response(
    JSON.stringify({
      success: true,
      pix_id: pixData.data.id,
      qr_code: pixData.data.brCode,
      qr_code_base64: pixData.data.brCodeBase64,
      amount: pixData.data.amount,
      expires_at: pixData.data.expiresAt,
      status: pixData.data.status,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCheckBilling(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  apiKey: string
) {
  const url = new URL(req.url)
  const billingId = url.searchParams.get('id')

  if (!billingId) {
    return new Response(
      JSON.stringify({ error: 'Billing ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const response = await fetch(`${ABACATEPAY_API_URL}/billing/get?id=${billingId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  })

  const data = await response.json()

  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCheckPixStatus(
  req: Request,
  apiKey: string
) {
  const url = new URL(req.url)
  const pixId = url.searchParams.get('id')

  if (!pixId) {
    return new Response(
      JSON.stringify({ error: 'PIX ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const response = await fetch(`${ABACATEPAY_API_URL}/pixQrCode/check?id=${pixId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  })

  const data = await response.json()

  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
