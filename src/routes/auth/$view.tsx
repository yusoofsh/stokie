import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { Globe } from "lucide-react"
import z from "zod"
import { AuthForm } from "@/components/auth/form"
import { Logo } from "@/components/logo"
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
            <h1 className="font-medium text-2xl">
              {import.meta.env.VITE_APP_TITLE || "Stokie"}
            </h1>
            <p className="text-sm">Kelola stok dengan mudah.</p>
          </div>
        </div>
        <div className="relative order-2 flex h-full">
          <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-87.5">
            <div className="space-y-2 text-center">
              <h1 className="font-medium text-3xl">
                {isSignUp ? "Buat akun Anda" : "Masuk ke akun Anda"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isSignUp
                  ? "Silakan masukkan detail Anda untuk mendaftar."
                  : "Silakan masukkan detail Anda untuk masuk."}
              </p>
            </div>
            <div className="space-y-4">
              <AuthForm isSignUp={isSignUp} />

              <div className="mt-5 space-y-5">
                {!isSignUp && (
                  <Link
                    className="block text-center text-muted-foreground text-sm underline"
                    to="/"
                  >
                    Lupa kata sandi Anda?
                  </Link>
                )}
                <p className="text-center text-sm">
                  {isSignUp ? (
                    <>
                      Sudah punya akun?
                      <Link
                        className="ml-1 text-muted-foreground underline"
                        params={{ view: "sign-in" }}
                        to="/auth/$view"
                      >
                        Masuk
                      </Link>
                    </>
                  ) : (
                    <>
                      Belum punya akun?
                      <Link
                        className="ml-1 text-muted-foreground underline"
                        params={{ view: "sign-up" }}
                        to="/auth/$view"
                      >
                        Buat akun
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 flex w-full justify-between px-10">
            <div className="text-sm">
              © {new Date().getFullYear()}{" "}
              {import.meta.env.VITE_APP_TITLE || "Stokie"}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Globe className="size-4 text-muted-foreground" />
              IND
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
