import { Container, Heading } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/admin")({
  component: Admin,
})

function Admin() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Administration Panel
      </Heading>
    </Container>
  )
}
