import { SiGithub } from "@icons-pack/react-simple-icons"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { Globe } from "lucide-react"
import z from "zod"
import { AuthForm } from "@/components/auth/form"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/auth/server"

export const Route = createFileRoute("/auth/$view")({
  component: AuthView,
  validateSearch: z.object({
    redirect: z.string().default("").catch(""),
  }),
  beforeLoad: async ({ search }) => {
    const session = await getSession()
    if (session) {
      throw redirect({
        to: search.redirect || "/dashboard",
      })
    }
  },
})

function AuthView() {
  const { view } = Route.useParams()
  const isSignUp = view === "sign-up"

  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-1 hidden h-full rounded-3xl bg-primary lg:flex">
          <div className="absolute top-10 space-y-1 px-10 text-primary-foreground">
            <Link to="/">
              <Logo className="size-10" />
            </Link>
            <h1 className="font-medium text-2xl">Scaffoe</h1>
            <p className="text-sm">Design. Build. Launch. Repeat.</p>
          </div>

          <div className="absolute bottom-10 flex w-full justify-between px-10">
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium">Ready to launch?</h2>
              <p className="text-sm">
                Clone the repo, install dependencies, and your dashboard is live
                in minutes.
              </p>
            </div>
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium">Need help?</h2>
              <p className="text-sm">
                Check out the docs or open an issue on GitHub, community support
                is just a click away.
              </p>
            </div>
          </div>
        </div>
        <div className="relative order-2 flex h-full">
          <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-87.5">
            <div className="space-y-2 text-center">
              <h1 className="font-medium text-3xl">
                {isSignUp ? "Create your account" : "Sign in to your account"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isSignUp
                  ? "Please enter your details to sign up."
                  : "Please enter your details to sign in."}
              </p>
            </div>
            <div className="space-y-4">
              <Button className="w-full" type="button" variant="secondary">
                <SiGithub className="size-4" />
                Continue with Github
              </Button>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
                <span className="relative z-10 bg-background px-2">
                  Or continue with
                </span>
              </div>

              <AuthForm isSignUp={isSignUp} />

              <div className="mt-5 space-y-5">
                {!isSignUp && (
                  <Link
                    className="block text-center text-muted-foreground text-sm underline"
                    to="/"
                  >
                    Forgot your password?
                  </Link>
                )}
                <p className="text-center text-sm">
                  {isSignUp ? (
                    <>
                      Already have an account?
                      <Link
                        className="ml-1 text-muted-foreground underline"
                        params={{ view: "sign-in" }}
                        to="/auth/$view"
                      >
                        Sign in
                      </Link>
                    </>
                  ) : (
                    <>
                      Don&apos;t have an account?
                      <Link
                        className="ml-1 text-muted-foreground underline"
                        params={{ view: "sign-up" }}
                        to="/auth/$view"
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 flex w-full justify-between px-10">
            <div className="text-sm">© {new Date().getFullYear()} Scaffoe</div>
            <div className="flex items-center gap-1 text-sm">
              <Globe className="size-4 text-muted-foreground" />
              ENG
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
