import { IconButton, Table, Text } from "@chakra-ui/react"
import type React from "react"
import { FaPlay } from "react-icons/fa"

interface GameSession {
  id: string
  date: string
}

interface GameSessionsProps {
  sessions: GameSession[]
  onJoinSession: (sessionId: string) => void
}

export const GameSessions: React.FC<GameSessionsProps> = ({
  sessions,
  onJoinSession,
}) => {
  return (
    <Table.Root size="sm">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Session ID</Table.ColumnHeader>
          <Table.ColumnHeader>Date</Table.ColumnHeader>
          <Table.ColumnHeader>Action</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sessions.map((session) => (
          <Table.Row key={session.id}>
            <Table.Cell>
              <Text>{session.id}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text>{session.date}</Text>
            </Table.Cell>
            <Table.Cell textAlign="end">
              <IconButton
                aria-label="Join session"
                onClick={() => onJoinSession(session.id)}
                colorScheme="blue"
                size="sm"
              >
                <FaPlay />
              </IconButton>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
