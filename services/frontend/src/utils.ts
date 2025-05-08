import type {
  HttpValidationError,
  ValidationError,
} from "./client/usuarios/types.gen"
import useCustomToast from "./hooks/useCustomToast"

export const emailPattern = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "Correo electrónico inválido",
}

export const namePattern = {
  value: /^[A-Za-z\s\u00C0-\u017F]{1,30}$/,
  message: "Nombre de usuario inválido",
}

export const passwordRules = (isRequired = true) => {
  const rules: any = {
    minLength: {
      value: 8,
      message: "La contraseña debe tener al menos 8 caracteres",
    },
  }

  if (isRequired) {
    rules.required = "La contraseña es requerida"
  }

  return rules
}

export const confirmPasswordRules = (
  getValues: () => any,
  isRequired = true,
) => {
  const rules: any = {
    validate: (value: string) => {
      const password = getValues().password || getValues().new_password
      return value === password ? true : "Las contraseñas no coinciden"
    },
  }

  if (isRequired) {
    rules.required = "La confirmación de la contraseña es requerida"
  }

  return rules
}

export const handleError = (err: {
  body?: HttpValidationError
  status?: number
}) => {
  const { showErrorToast } = useCustomToast()
  const errDetail = err.body?.detail
  let errorMessage = "Ocurrió un error."

  if (Array.isArray(errDetail)) {
    const validationError = errDetail[0] as ValidationError
    errorMessage = validationError.msg
  }

  showErrorToast(errorMessage)
}
