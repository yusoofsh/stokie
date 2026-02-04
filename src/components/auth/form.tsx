import { revalidateLogic } from "@tanstack/react-form"
import { CircleAlertIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { useState } from "react"
import { useAppForm } from "@/components/tanstack/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip"
import { auth } from "@/lib/auth/client"
import {
  type SignUpInput,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/validation"

interface AuthFormProps {
  isSignUp?: boolean
}

export function AuthForm({ isSignUp }: AuthFormProps) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    } as SignUpInput,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: isSignUp
        ? signUpSchema
        : (signInSchema as unknown as typeof signUpSchema),
      onDynamicAsyncDebounceMs: 500,
    },
    onSubmit: async ({ value }) => {
      if (isSignUp) {
        await auth.signUp.email(
          {
            email: value.email,
            password: value.password,
            name: value.name,
          },
          {
            onSuccess: () => {
              location.reload()
            },
            onError: ({ error }: { error: { message: string } }) => {
              setAlertMessage(error.message)
            },
          }
        )
      } else {
        await auth.signIn.email(
          {
            email: value.email,
            password: value.password,
          },
          {
            onSuccess: () => {
              location.reload()
            },
            onError: ({ error }: { error: { message: string } }) => {
              setAlertMessage(error.message)
            },
          }
        )
      }
    },
    onSubmitInvalid({ formApi }) {
      const errorMap = formApi.state.errorMap.onDynamic
      const inputs = Array.from(
        document.querySelectorAll("#auth-form input")
      ) as HTMLInputElement[]
      let firstInput: HTMLInputElement | undefined
      for (const input of inputs) {
        if (errorMap?.[input.name]) {
          firstInput = input
          break
        }
      }
      firstInput?.focus()
    },
  })

  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-4">
      {alertMessage && (
        <Alert variant="error">
          <CircleAlertIcon />
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}
      <form.AppForm>
        <form.Form id="auth-form">
          {isSignUp && (
            <form.AppField name={"name"}>
              {(field) => (
                <field.Field>
                  <field.Fieldset className="w-full">
                    <field.FieldLabel htmlFor={"name"}>Name</field.FieldLabel>
                    <field.Input
                      name={"name"}
                      placeholder="John Doe"
                      type="text"
                    />
                    <field.FieldError />
                  </field.Fieldset>
                </field.Field>
              )}
            </form.AppField>
          )}

          <form.AppField name={"email"}>
            {(field) => (
              <field.Field>
                <field.Fieldset className="w-full">
                  <field.FieldLabel htmlFor={"email"}>Email </field.FieldLabel>
                  <field.Input
                    name={"email"}
                    placeholder="you@example.com"
                    type="email"
                  />
                  <field.FieldError />
                </field.Fieldset>
              </field.Field>
            )}
          </form.AppField>

          <form.AppField name={"password"}>
            {(field) => (
              <field.Field>
                <field.Fieldset className="w-full">
                  <field.FieldLabel htmlFor={"password"}>
                    Password
                  </field.FieldLabel>
                  <field.InputGroup>
                    <field.InputGroupInput
                      aria-label="Password with toggle visibility"
                      id={"password"}
                      name={"password"}
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                    />
                    <field.InputGroupAddon align="inline-end">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              onClick={() => setShowPassword(!showPassword)}
                              size="icon-xs"
                              variant="ghost"
                            />
                          }
                        >
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </TooltipTrigger>
                        <TooltipPopup>
                          {showPassword ? "Hide password" : "Show password"}
                        </TooltipPopup>
                      </Tooltip>
                    </field.InputGroupAddon>
                  </field.InputGroup>
                  <field.FieldError />
                </field.Fieldset>
              </field.Field>
            )}
          </form.AppField>

          <form.SubmitButton
            className="w-full"
            label={isSignUp ? "Create account" : "Continue with email"}
          />
        </form.Form>
      </form.AppForm>
    </div>
  )
}
