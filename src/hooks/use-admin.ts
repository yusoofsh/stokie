import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "@/components/ui/toast"
import { auth } from "@/lib/auth/client"

export function useAdmin() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const [changingRoleUserId, setChangingRoleUserId] = useState<string | null>(
    null
  )

  const { mutate: createUser, isPending: isCreating } = useMutation({
    mutationFn: ({
      email,
      password,
      name,
      role,
    }: Parameters<typeof auth.admin.createUser>[0]) =>
      auth.admin.createUser({ email, password, name, role }),
    onSuccess: () => {
      toast.add({ description: "Pengguna berhasil dibuat", type: "success" })
    },
    onError: (error) => {
      toast.add({
        description: error.message || "Gagal membuat pengguna",
        type: "error",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const { mutate: setRole, isPending: isRoleChanging } = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      auth.admin.setRole({ userId, role: role as never }),
    onMutate: ({ userId }) => {
      setChangingRoleUserId(userId)
    },
    onSuccess: () => {
      toast.add({ description: "Peran pengguna diperbarui", type: "success" })
    },
    onError: (error) => {
      toast.add({
        description: error.message || "Gagal memperbarui peran",
        type: "error",
      })
    },
    onSettled: () => {
      setChangingRoleUserId(null)
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const { mutate: banUser, isPending: isBanning } = useMutation({
    mutationFn: ({
      userId,
      banReason,
      banExpiresIn,
    }: Parameters<typeof auth.admin.banUser>[0]) =>
      auth.admin.banUser({
        userId,
        banReason,
        banExpiresIn,
      }),
    onSuccess: () => {
      toast.add({ description: "Pengguna berhasil diblokir", type: "success" })
    },
    onError: (error) => {
      toast.add({
        description: error.message || "Gagal memblokir pengguna",
        type: "error",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const { mutate: unbanUser, isPending: isUnbanning } = useMutation({
    mutationFn: (userId: string) => auth.admin.unbanUser({ userId }),
    onSuccess: () => {
      toast.add({ description: "Blokir pengguna dibuka", type: "success" })
    },
    onError: (error) => {
      toast.add({
        description: error.message || "Gagal membuka blokir pengguna",
        type: "error",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const { mutate: revokeSessions, isPending: isRevokingSessions } = useMutation(
    {
      mutationFn: (userId: string) => auth.admin.revokeUserSessions({ userId }),
      onSuccess: () => {
        toast.add({ description: "Sesi pengguna dicabut", type: "success" })
      },
      onError: (error) => {
        toast.add({
          description: error.message || "Gagal mencabut sesi",
          type: "error",
        })
      },
    }
  )

  const { mutate: impersonateUser, isPending: isImpersonating } = useMutation({
    mutationFn: (userId: string) => auth.admin.impersonateUser({ userId }),
    onSuccess: () => {
      toast.add({
        description: "Menyamar sebagai pengguna berhasil",
        type: "success",
      })
      router.navigate({ to: "/dashboard" })
    },
    onError: (error) => {
      toast.add({
        description: error.message || "Gagal menyamar sebagai pengguna",
        type: "error",
      })
    },
  })

  const { mutate: stopImpersonating, isPending: isStoppingImpersonation } =
    useMutation({
      mutationFn: () => auth.admin.stopImpersonating(),
      onSuccess: () => {
        toast.add({ description: "Berhenti menyamar", type: "success" })
        router.navigate({ to: "/dashboard/admin" })
      },
      onError: (error) => {
        toast.add({
          description: error.message || "Gagal berhenti menyamar",
          type: "error",
        })
      },
    })

  return {
    createUser,
    setRole,
    banUser,
    unbanUser,
    revokeSessions,
    impersonateUser,
    stopImpersonating,
    isCreating,
    isRoleChanging,
    isBanning,
    isUnbanning,
    isRevokingSessions,
    isImpersonating,
    isStoppingImpersonation,
    changingRoleUserId,
  }
}
