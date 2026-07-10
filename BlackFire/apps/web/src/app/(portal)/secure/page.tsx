import { redirect } from 'next/navigation'

export default function SecurePage() {
  redirect('/tracker?stream=call-log')
}
