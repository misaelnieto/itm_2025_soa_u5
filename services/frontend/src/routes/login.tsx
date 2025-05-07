import { Container, Image, Input, Text } from "@chakra-ui/react"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiMail } from "react-icons/fi"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import Logo from "/assets/images/itm-logo-vertical.svg"
import { emailPattern, passwordRules } from "../utils"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function Login() {
  const { loginMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await loginMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
    }
  }

  return (
    <>
      <Container
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        h="100vh"
        maxW="sm"
        alignItems="stretch"
        justifyContent="center"
        gap={4}
        centerContent
        bgColor="white"
        borderRadius="lg"
        p={4}
      >
        <Text textStyle="xl" fontWeight="bold" textAlign="center" color="blue.500">
          Arquitectura Orientada a Sistemas
        </Text>
        <Text textStyle="lg" fontWeight="bold" textAlign="center" color="blue.500">
          Proyecto Final de la unidad 5
        </Text>
        <Text textStyle="md" fontWeight="bold" textAlign="center" color="blue.500">
        Juegos implementados bajo la arquitectura de microservicios
        </Text>
        <Image
          src={Logo}
          alt="Instituto Tecnológico de Mexicali"
          height="auto"
          w="1/2"
          alignSelf="center"
          mb={4}
        />

        <Text textStyle="lg" fontWeight="bold" textAlign="center" color="blue.500">
          Inicia sesión o crear una cuenta
        </Text>
        <Field
          invalid={!!errors.username}
          errorText={errors.username?.message || !!error}
        >
          <InputGroup w="100%" startElement={<FiMail />}>
            <Input
              id="username"
              {...register("username", {
                required: "Usuario es requerido",
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
            />
          </InputGroup>
        </Field>
        <PasswordInput
          type="password"
          startElement={<FiLock />}
          {...register("password", passwordRules())}
          placeholder="Contraseña"
          errors={errors}
        />
        <RouterLink to="/recover-password" className="main-link">
          ¿Olvidaste tu contraseña?
        </RouterLink>
        <Button variant="solid" type="submit" loading={isSubmitting} size="md">
          Iniciar sesión
        </Button>
        <Text>
          No tienes una cuenta?{" "}
          <RouterLink to="/signup" className="main-link">
            Regístrate
          </RouterLink>
        </Text>
      </Container>
    </>
  )
}
