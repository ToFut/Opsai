// Check JWT token expiration
const jwt = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ6Z1BPdmhDSC1Ic21OQnhhV3lnLU11dlF6dHJERTBDSEJHZDB2MVh0Vnk0In0.eyJleHAiOjE3NTQwNzYxMjMsImlhdCI6MTc1NDA3NTIyMywianRpIjoiNDlhYjRkZDItZDkwMC00MmU5LWE1MmYtY2M1MTAxZGRhYTlkIiwiaXNzIjoiaHR0cHM6Ly9jbG91ZC5haXJieXRlLmNvbS9hdXRoL3JlYWxtcy9fYWlyYnl0ZS1hcHBsaWNhdGlvbi1jbGllbnRzIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjU3NjRjODkyLTMxM2MtNGJmNS04MzQ2LTU1NGZhYjQ2YTMwZSIsInR5cCI6IkJlYXJlciIsImF6cCI6IjRhZjdhNTc0LWIxNTUtNDdlZS04ZGNlLTJjZDJjNTE5YTM0YSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtX2FpcmJ5dGUtYXBwbGljYXRpb24tY2xpZW50cyJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJjbGllbnRIb3N0IjoiMTcyLjIzLjEuMjQxIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJ1c2VyX2lkIjoiNTc2NGM4OTItMzEzYy00YmY1LTgzNDYtNTU0ZmFiNDZhMzBlIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic2VydmljZS1hY2NvdW50LTRhZjdhNTc0LWIxNTUtNDdlZS04ZGNlLTJjZDJjNTE5YTM0YSIsImNsaWVudEFkZHJlc3MiOiIxNzIuMjMuMS4yNDEiLCJjbGllbnRfaWQiOiI0YWY3YTU3NC1iMTU1LTQ3ZWUtOGRjZS0yY2QyYzUxOWEzNGEifQ.l0JpTWb2FCqL8BMoEX7rQBzaS25xqHNi51titMLdqLCYUNaFxNBgmXkNCDaH8RxIwMzk83CAvt9VNT2VTJD5w_1FR7OxiRRkHO9dwXYb4A0xpeVPrgDXorVUpA8bkrhMve9SGEAYj-S7clsvUWPyB50-ff4_S94cADv7PLC08AUa4-pNyKegyg3A1CIZYPw1kt4HldOHVPFLYyekdOl3PEnIILTmR89uOoY9tEm308DzsDM_-XVd_qWlzPqF74ao3zVNpTN6dghMOCEhZ4jZHs_kk19IxZvrZyoBxyS2w5L0M2sy4YUZHpeK1bCRk7rn0sPJkLk4aH9x-vp4ja3ERQ'

try {
  // Decode JWT payload
  const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
  
  console.log('🔍 JWT Token Analysis')
  console.log('====================')
  console.log('Issued at (iat):', new Date(payload.iat * 1000).toLocaleString())
  console.log('Expires at (exp):', new Date(payload.exp * 1000).toLocaleString())
  console.log('Current time:', new Date().toLocaleString())
  console.log('Is expired?', Date.now() > payload.exp * 1000 ? '❌ YES' : '✅ NO')
  console.log('Time until expiry:', Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60), 'minutes')
  
} catch (error) {
  console.error('Failed to decode JWT:', error)
}