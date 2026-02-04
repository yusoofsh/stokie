import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowUpRight, CirclePlay } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-12 lg:grid-cols-2 lg:py-0">
        <div className="my-auto">
          <Badge
            className="rounded-full border-border px-2 py-3"
            render={<Link to="/" />}
            variant="secondary"
          >
            Just released v1.0.0 <ArrowUpRight className="ml-1 size-4" />
          </Badge>
          <h1 className="mt-6 max-w-[17ch] font-semibold text-4xl leading-[1.2] tracking-[-0.035em] md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem]">
            Welcome to Scaffoe
          </h1>
          <p className="mt-6 max-w-[60ch] text-foreground/80 text-lg">
            Build modern dashboards faster with Scaffoe, a powerful starter
            template designed for developers. Get production-ready components,
            stunning UI blocks, and best practices out of the box.
          </p>
          <div className="mt-12 flex items-center gap-4">
            <Button
              className="rounded-full text-base"
              render={<Link to="/dashboard" />}
              size="lg"
            >
              Get Started <ArrowUpRight className="h-5 w-5" />
            </Button>
            <Button
              className="rounded-full text-base shadow-none"
              size="lg"
              variant="outline"
            >
              <CirclePlay className="h-5 w-5" /> Watch Demo
            </Button>
          </div>
        </div>
        <div className="aspect-video w-full rounded-xl bg-accent lg:aspect-auto lg:h-[calc(100vh-4rem)] lg:w-250" />
      </div>
    </div>
  )
}
