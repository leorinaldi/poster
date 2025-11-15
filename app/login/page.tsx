import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Sign in to Poster
          </h2>
          <p className="mt-2 text-gray-600">
            Use your Google account to continue
          </p>
        </div>
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/" })
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  )
}
