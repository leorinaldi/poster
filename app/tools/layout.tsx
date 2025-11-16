import { auth } from "@/auth"
import { ProjectProvider } from "./ProjectContext"
import ToolsLayoutClient from "./ToolsLayoutClient"

export default async function ToolsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <ProjectProvider>
      <ToolsLayoutClient session={session}>
        {children}
      </ToolsLayoutClient>
    </ProjectProvider>
  )
}
