import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ResetPasswordRequest {
  email: string;
  newPassword: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, newPassword }: ResetPasswordRequest = await req.json()

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Email and new password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Firebase Admin
    const { initializeApp, cert } = await import('npm:firebase-admin@12.0.0/app')
    const { getFirestore } = await import('npm:firebase-admin@12.0.0/firestore')
    const { getAuth } = await import('npm:firebase-admin@12.0.0/auth')

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
    const auth = getAuth(app)

    // Check if OTP was verified
    const otpDoc = await db.collection('otp_codes').doc(email).get()
    
    if (!otpDoc.exists || !otpDoc.data()?.verified) {
      return new Response(
        JSON.stringify({ error: 'OTP not verified. Please verify OTP first.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user by email and update password
    const user = await auth.getUserByEmail(email)
    await auth.updateUser(user.uid, { 
      password: newPassword 
    })

    // Clean up OTP record
    await db.collection('otp_codes').doc(email).delete()

    return new Response(
      JSON.stringify({ message: 'Password reset successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error resetting password:', error)
    
    if (error.code === 'auth/user-not-found') {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Failed to reset password' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})