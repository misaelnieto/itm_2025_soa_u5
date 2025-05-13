import { Container, Image, Input, Text } from "@chakra-ui/react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiUser } from "react-icons/fi"
import { Theme } from "@chakra-ui/react"

import Logo from "../../public/assets/images/itm-logo-vertical.svg"
import { Button } from "../components/ui/button"
import { Field } from "../components/ui/field"
import { InputGroup } from "../components/ui/input-group"
import { PasswordInput } from "../components/ui/password-input"
import useAuth, { isLoggedIn } from "../hooks/useAuth"
import {passwordRules } from "../utils"
import type { BodyLogin } from "@/client/usuarios";

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
  } = useForm<BodyLogin>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<BodyLogin> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await loginMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
    }
  }

  return (
    <Theme appearance="light">
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
        <Text
          textStyle="xl"
          fontWeight="bold"
          textAlign="center"
          color="blue.500"
        >
          Arquitectura Orientada a Sistemas
        </Text>
        <Text
          textStyle="lg"
          fontWeight="bold"
          textAlign="center"
          color="blue.500"
        >
          Proyecto Final de la unidad 5
        </Text>
        <Text
          textStyle="md"
          fontWeight="bold"
          textAlign="center"
          color="blue.500"
        >
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

        <Text
          textStyle="lg"
          fontWeight="bold"
          textAlign="center"
          color="blue.500"
        >
          Inicia sesión para continuar
        </Text>
        <Field
          invalid={!!errors.username}
          errorText={errors.username?.message || !!error}
        >
          <InputGroup w="100%" startElement={<FiUser />}>
            <Input
              id="username"
              {...register("username", {
                required: "Usuario es requerido",
              })}
              placeholder="Nombre de usuario"
              type="text"
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
        <Button variant="solid" type="submit" loading={isSubmitting} size="md">
          Iniciar sesión
        </Button>
      </Container>
    </Theme>
  )
}
