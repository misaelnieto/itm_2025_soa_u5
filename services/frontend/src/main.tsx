/// <reference types="vite/client" />

import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import React, { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { routeTree } from "./routeTree.gen"

import { client as usuarios_client } from "./client/usuarios/client.gen"
import type { HttpValidationError } from "./client/usuarios/types.gen"
import { CustomProvider } from "./components/ui/provider"

const router = createRouter({ routeTree })

usuarios_client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL,
})

const handleApiError = (error: unknown) => {
  const err = error as { body?: HttpValidationError; status?: number }
  if ([401, 403].includes(err.status || 0)) {
    localStorage.removeItem("access_token")
    window.location.href = "/login"
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CustomProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </CustomProvider>
  </StrictMode>,
)
