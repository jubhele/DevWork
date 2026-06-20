import { redirect } from 'next/navigation'

export default async function CalloutsPage() {
  redirect('/tracker?stream=call-log')
}
