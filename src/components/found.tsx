import { Link, type NotFoundRouteProps } from "@tanstack/react-router"
import { Button } from "./ui/button"

export function NotFound(_: NotFoundRouteProps) {
  return (
    <div className="space-y-2 p-2">
      <div className="text-gray-600 dark:text-gray-400">
        <p>Halaman yang Anda cari tidak ada.</p>
      </div>
      <p className="flex flex-wrap items-center gap-2">
        <Button
          className="cursor-pointer rounded bg-emerald-500 px-2 py-1 font-black text-sm text-white uppercase"
          onClick={() => window.history.back()}
        >
          Kembali
        </Button>
        <Link
          className="rounded bg-cyan-600 px-2 py-1 font-black text-sm text-white uppercase"
          to="/"
        >
          Mulai Ulang
        </Link>
      </p>
    </div>
  )
}
