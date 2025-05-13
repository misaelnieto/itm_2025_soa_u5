import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { login, testAccessToken } from "../client/usuarios/sdk.gen"
import type {
  BodyLogin,
  HttpValidationError,
  UserPublic,
  Token,
} from "../client/usuarios/types.gen"
import { handleError } from "../utils"

const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null
}

const useAuth = () => {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: user } = useQuery<UserPublic, Error>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const token =localStorage.getItem("access_token")
      if (!token) {
        throw new Error("No access token found")
      }
      const response = await testAccessToken({
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!response.data) {
        throw new Error("No user data received")
      }
      return response.data
    },
    enabled: isLoggedIn(),
  })

  const resetError = () => setError(null)

  const loginMutation = useMutation<Token, Error, BodyLogin>({
    mutationFn: async (data) => {
      const response = await login({ body: data })
      if (!response.data) {
        throw new Error("Login failed")
      }
      return response.data
    },
    onSuccess: (response) => {
      localStorage.setItem("access_token", response.access_token)
      navigate({ to: "/" })
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
    onError: (error: Error) => {
      // Handle both standard errors and API errors
      if (error instanceof Error) {
        handleError({
          body: {
            detail: [{
              loc: ["body"],
              msg: error.message,
              type: "validation_error"
            }]
          }
        })
      } else {
        handleError(error as { body?: HttpValidationError; status?: number })
      }
    },
  })

  const logout = () => {
    localStorage.removeItem("access_token")
    queryClient.setQueryData(["currentUser"], null)
    navigate({ to: "/login" })
  }

  return {
    user,
    error,
    resetError,
    loginMutation,
    logout,
  }
}

export { isLoggedIn }
export default useAuth
