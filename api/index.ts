import type { IncomingMessage, ServerResponse } from 'http'
import app from './app'

// Serverless handler that proxies requests to the Express app
export default function handler(req: IncomingMessage, res: ServerResponse) {
  // Express app is a request listener compatible with (req, res)
  // Vercel's runtime will call this exported function per request
  ;(app as any)(req, res)
}