import React from "react";
import { Avatar, Button, Card } from "@chakra-ui/react";

interface GameCardProps {
  avatarSrc: React.ElementType;
  fallbackName: string;
  title: string;
  description: string;
}

const GameCard: React.FC<GameCardProps> = ({
  avatarSrc: Icon,
  fallbackName,
  title,
  description,
}) => {
  const onLeaderboardViewClick = () => {
    console.log("View")
  };

  const onPlayClick = () => {
    console.log("Play")
  };

  return (
    <Card.Root width="320px">
      <Card.Body gap="2">
        <Avatar.Root size="lg" shape="rounded">
          <Avatar.Image />
          <Icon size="md" />
          <Avatar.Fallback name={fallbackName} />
        </Avatar.Root>
        <Card.Title mt="2">{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Body>
      <Card.Footer justifyContent="flex-end">
        <Button variant="outline" onClick={onLeaderboardViewClick}>
          View leaderboard
        </Button>
        <Button onClick={onPlayClick}>Play</Button>
      </Card.Footer>
    </Card.Root>
  );
};

export default GameCard;