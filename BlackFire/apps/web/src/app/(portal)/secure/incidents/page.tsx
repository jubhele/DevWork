import { redirect } from 'next/navigation'

export default function IncidentsPage() {
  redirect('/tracker?stream=call-log')
}
