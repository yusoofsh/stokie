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
      toast.add({ description: "User created successfully", type: "success" })
    },
    onError: (error) => {
      toast.add({
        description: error.message || "Failed to create user",
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
      toast.add({ description: "User role updated", type: "success" })
    },
    onError: (error) => {
      toast.add({
        description: error.message || "Failed to update role",
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
      toast.add({ description: "User banned successfully", type: "success" })
    },
    onError: (error) => {
      toast.add({
        description: error.message || "Failed to ban user",
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
      toast.add({ description: "User unbanned successfully", type: "success" })
    },
    onError: (error) => {
      toast.add({
        description: error.message || "Failed to unban user",
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
        toast.add({ description: "Sessions revoked for user", type: "success" })
      },
      onError: (error) => {
        toast.add({
          description: error.message || "Failed to revoke sessions",
          type: "error",
        })
      },
    }
  )

  const { mutate: impersonateUser, isPending: isImpersonating } = useMutation({
    mutationFn: (userId: string) => auth.admin.impersonateUser({ userId }),
    onSuccess: () => {
      toast.add({
        description: "Impersonated user successfully",
        type: "success",
      })
      router.navigate({ to: "/dashboard" })
    },
    onError: (error) => {
      toast.add({
        description: error.message || "Failed to impersonate user",
        type: "error",
      })
    },
  })

  const { mutate: stopImpersonating, isPending: isStoppingImpersonation } =
    useMutation({
      mutationFn: () => auth.admin.stopImpersonating(),
      onSuccess: () => {
        toast.add({ description: "Stopped impersonation", type: "success" })
        router.navigate({ to: "/dashboard/admin" })
      },
      onError: (error) => {
        toast.add({
          description: error.message || "Failed to stop impersonation",
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
