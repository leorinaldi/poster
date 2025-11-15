import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold">Welcome to Poster, {session.user?.name}!</h1>
      <p className="mt-4 text-gray-600">{session.user?.email}</p>
    </div>
  )
}
