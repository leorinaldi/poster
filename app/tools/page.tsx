import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import ToolsInterface from "./tools-interface"

export default async function ToolsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Fetch all tools from database
  const tools = await prisma.tool.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Top Header Bar */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-indigo-600">
              Poster
            </h1>
            <div className="flex items-center gap-4">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{session.user?.name}</p>
                <p className="text-gray-600">{session.user?.email}</p>
              </div>
              <Link
                href="/account"
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Account Settings
              </Link>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/login" })
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex-1 overflow-hidden">
        <ToolsInterface tools={tools} />
      </div>
    </div>
  )
}
