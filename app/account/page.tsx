import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default async function AccountPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Account Settings
          </h1>

          {/* Profile Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Profile Information
            </h2>
            <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-lg">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              )}
              <div>
                <div className="mb-2">
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="text-lg font-medium text-gray-900">
                    {session.user.name}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="text-lg font-medium text-gray-900">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
