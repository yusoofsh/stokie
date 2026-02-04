import { z } from "zod"

export const signInSchema = z.object({
  email: z.string().email("Silakan masukkan email yang valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
})

export const signUpSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Silakan masukkan email yang valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
