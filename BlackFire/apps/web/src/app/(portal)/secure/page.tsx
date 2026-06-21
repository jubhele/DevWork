import { redirect } from 'next/navigation'

export default function SecurePage() {
  redirect('/secure/incidents')
}
