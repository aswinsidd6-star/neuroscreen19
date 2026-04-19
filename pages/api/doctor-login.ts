import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
  success: boolean
  error?: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    const { password } = req.body

    // Validate input
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Password is required' })
    }

    // Get doctor password from environment, with a safe default (must be changed)
    const doctorPassword = process.env.DOCTOR_PASSWORD
    if (!doctorPassword) {
      console.error('[doctor-login] DOCTOR_PASSWORD environment variable not set')
      return res.status(500).json({ success: false, error: 'Server configuration error' })
    }

    // Compare passwords
    if (password === doctorPassword) {
      return res.status(200).json({ success: true })
    } else {
      return res.status(401).json({ success: false, error: 'Incorrect password' })
    }
  } catch (error) {
    console.error('[doctor-login] Error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
