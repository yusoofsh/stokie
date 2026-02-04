/**
 * TanStack Form Integration with Base UI Primitives
 *
 * TANCN-compatible form system that works with your Base UI components.
 * Change the import in TANCN-generated code from:
 *   @/components/ui/tanstack-form
 * To:
 *   @/components/tanstack/form
 *
 * Everything else works exactly the same.
 */

import {
  createFormHook,
  createFormHookContexts,
  useStore,
} from "@tanstack/react-form"
import type { VariantProps } from "class-variance-authority"
import React from "react"
import { Button, type buttonVariants } from "@/components/ui/button"
import {
  Field as DefaultField,
  FieldError as DefaultFieldError,
  FieldDescription,
  FieldLabel,
  type fieldVariants,
} from "@/components/ui/field"
import { Fieldset } from "@/components/ui/fieldset"
import { Form as DefaultForm } from "@/components/ui/form"
import { Input as DefaultInput, type InputProps } from "@/components/ui/input"
import {
  InputGroupInput as DefaultInputGroupInput,
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface FormItemContextValue {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

const useFormItemId = () => {
  const { id } = React.useContext(FormItemContext)
  if (!id) {
    throw new Error("useFormItemId should be used within <Field>")
  }
  return {
    id,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
  }
}

function Input({ children, ...props }: InputProps) {
  const field = useFieldContext()

  return (
    <DefaultInput
      aria-invalid={
        (!!field.state.meta.errors.length && field.state.meta.isTouched) ||
        undefined
      }
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      value={
        field.state.value as string | number | readonly string[] | undefined
      }
      {...props}
    >
      {children}
    </DefaultInput>
  )
}

function InputGroupInput({ children, ...props }: InputProps) {
  const field = useFieldContext()

  return (
    <DefaultInputGroupInput
      aria-invalid={
        (!!field.state.meta.errors.length && field.state.meta.isTouched) ||
        undefined
      }
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      value={
        field.state.value as string | number | readonly string[] | undefined
      }
      {...props}
    >
      {children}
    </DefaultInputGroupInput>
  )
}

function Field({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <DefaultField {...props}>{children}</DefaultField>
    </FormItemContext.Provider>
  )
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  const { formMessageId } = useFormItemId()
  const field = useFieldContext()
  const errors = useStore(field.store, (state) => state.meta.errors)
  const isTouched = useStore(field.store, (state) => state.meta.isTouched)

  if (errors.length === 0 || !isTouched) {
    return null
  }

  return <DefaultFieldError errors={errors} id={formMessageId} {...props} />
}

function Form({
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"form">, "onSubmit" | "noValidate"> & {
  children?: React.ReactNode
}) {
  const form = useFormContext()
  const handleSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      e.stopPropagation()
      form.handleSubmit()
    },
    [form]
  )
  return (
    <DefaultForm noValidate onSubmit={handleSubmit} {...props}>
      {children}
    </DefaultForm>
  )
}

function SubmitButton({
  label,
  className,
  size,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    label: string
  }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button
          className={cn("mt-2", className)}
          disabled={!canSubmit}
          size={size}
          type="submit"
          variant={props.variant}
          {...props}
        >
          {isSubmitting && <Spinner />}
          {label}
        </Button>
      )}
    </form.Subscribe>
  )
}

function StepButton({
  label,
  handleMovement,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    label: React.ReactNode | string
    handleMovement: () => void
  }) {
  return (
    <Button
      onClick={handleMovement}
      size="sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {label}
    </Button>
  )
}

const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    Field,
    FieldError,
    Fieldset,
    FieldDescription,
    FieldLabel,
    Input,
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
  },
  formComponents: {
    SubmitButton,
    StepButton,
    Form,
  },
})

export { useAppForm, useFieldContext, useFormContext, withFieldGroup, withForm }
