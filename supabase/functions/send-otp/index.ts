import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SendOtpRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email }: SendOtpRequest = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

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
      // App might already be initialized
      const { getApps, getApp } = await import('npm:firebase-admin@12.0.0/app')
      app = getApps().length > 0 ? getApp() : initializeApp({
        credential: cert(serviceAccount)
      })
    }

    const db = getFirestore(app)

    // Save OTP to Firestore
    await db.collection('otp_codes').doc(email).set({
      otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    })

    // Send email using Gmail SMTP
    const nodemailer = await import('npm:nodemailer@6.9.8')
    
    const transporter = nodemailer.default.createTransporter({
      service: 'gmail',
      auth: {
        user: 'oyieeofficial@gmail.com',
        pass: 'dkrf actk ncld kmjp'
      }
    })

    const mailOptions = {
      from: 'OYIEE 🔒 <oyieeofficial@gmail.com>',
      to: email,
      subject: 'Your OYIEE Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #D4AF37; padding: 20px; border-radius: 10px;">
          <h2 style="text-align: center; color: #D4AF37; text-shadow: 0 0 10px #D4AF37;">🔒 OYIEE Password Reset</h2>
          <p style="font-size: 16px; line-height: 1.6;">Your OTP for password reset is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #D4AF37; background: #1a1a1a; padding: 15px 30px; border-radius: 8px; border: 2px solid #D4AF37; text-shadow: 0 0 15px #D4AF37;">${otp}</span>
          </div>
          <p style="color: #ccc;">This OTP is valid for <strong>10 minutes</strong> only.</p>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)

    return new Response(
      JSON.stringify({ message: 'OTP sent successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending OTP:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send OTP' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})