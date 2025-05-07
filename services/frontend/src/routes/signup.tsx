import { Container, Flex, Image, Input, Text } from "@chakra-ui/react"
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiLock, FiUser } from "react-icons/fi"

import type { UserRegister } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { confirmPasswordRules, emailPattern, passwordRules } from "@/utils"
import Logo from "/assets/images/itm-logo-vertical.svg"

export const Route = createFileRoute("/signup")({
  component: SignUp,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

interface UserRegisterForm extends UserRegister {
  confirm_password: string
}

function SignUp() {
  const { signUpMutation } = useAuth()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit: SubmitHandler<UserRegisterForm> = (data) => {
    signUpMutation.mutate(data)
  }

  return (
    <>
      <Flex flexDir={{ base: "column", md: "row" }} justify="center" h="100vh">
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
            Tienes que crear una cuenta para jugar
          </Text>
          <Field
            invalid={!!errors.full_name}
            errorText={errors.full_name?.message}
          >
            <InputGroup w="100%" startElement={<FiUser />}>
              <Input
                id="full_name"
                minLength={3}
                {...register("full_name", {
                  required: "Nombre completo es requerido",
                })}
                placeholder="Nombre completo"
                type="text"
              />
            </InputGroup>
          </Field>

          <Field invalid={!!errors.email} errorText={errors.email?.message}>
            <InputGroup w="100%" startElement={<FiUser />}>
              <Input
                id="email"
                {...register("email", {
                  required: "Correo electrónico es requerido",
                  pattern: emailPattern,
                })}
                placeholder="Correo electrónico"
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
          <PasswordInput
            type="confirm_password"
            startElement={<FiLock />}
            {...register("confirm_password", confirmPasswordRules(getValues))}
            placeholder="Confirmar contraseña"
            errors={errors}
          />
          <Button variant="solid" type="submit" loading={isSubmitting}>
            Crear cuenta
          </Button>
          <Text>
            Ya tienes una cuenta?{" "}
            <RouterLink to="/login" className="main-link">
              Iniciar sesión
            </RouterLink>
          </Text>
        </Container>
      </Flex>
    </>
  )
}

export default SignUp
