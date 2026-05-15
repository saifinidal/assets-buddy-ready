import { createFileRoute } from "@tanstack/react-router";
import ClientApp from "@/ClientApp";

export const Route = createFileRoute("/terms")({
  component: ClientApp,
});
