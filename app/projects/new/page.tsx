import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export default async function NewProjectPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  async function createProject(formData: FormData) {
    "use server"

    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string

    await prisma.project.create({
      data: {
        name,
        description,
        userId: session.user.id,
      },
    })

    redirect("/tools")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl w-full p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Your First Project
        </h1>
        <p className="text-gray-600 mb-8">
          Get started by creating a project to organize your work.
        </p>

        <form action={createProject} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Project Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe your project (optional)"
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Create Project
          </button>
        </form>
      </div>
    </div>
  )
}
