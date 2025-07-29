import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, otp }: VerifyOtpRequest = await req.json()

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Firebase Admin
    const { initializeApp, cert } = await import('npm:firebase-admin@12.0.0/app')
    const { getFirestore } = await import('npm:firebase-admin@12.0.0/firestore')

    const serviceAccount = {
      type: "service_account",
      project_id: "oyieeprofile",
      private_key_id: Deno.env.get('FIREBASE_PRIVATE_KEY_ID'),
      private_key: Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      client_email: Deno.env.get('FIREBASE_CLIENT_EMAIL'),
      client_id: Deno.env.get('FIREBASE_CLIENT_ID'),
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${Deno.env.get('FIREBASE_CLIENT_EMAIL')}`
    }

    let app
    try {
      app = initializeApp({
        credential: cert(serviceAccount)
      })
    } catch (error) {
      const { getApps, getApp } = await import('npm:firebase-admin@12.0.0/app')
      app = getApps().length > 0 ? getApp() : initializeApp({
        credential: cert(serviceAccount)
      })
    }

    const db = getFirestore(app)

    // Get OTP from Firestore
    const otpDoc = await db.collection('otp_codes').doc(email).get()

    if (!otpDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'OTP not found or expired' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const otpData = otpDoc.data()
    const now = new Date()
    const expiresAt = otpData?.expiresAt?.toDate()

    // Check if OTP is expired
    if (now > expiresAt) {
      // Delete expired OTP
      await db.collection('otp_codes').doc(email).delete()
      return new Response(
        JSON.stringify({ error: 'OTP has expired' }),
        { 
          status: 410, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify OTP
    if (otpData?.otp === otp) {
      // Mark OTP as verified (optional - you can delete it instead)
      await db.collection('otp_codes').doc(email).update({
        verified: true,
        verifiedAt: new Date()
      })

      return new Response(
        JSON.stringify({ success: true, message: 'OTP verified successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid OTP' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error verifying OTP:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to verify OTP' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})