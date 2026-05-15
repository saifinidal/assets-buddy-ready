import { createFileRoute } from "@tanstack/react-router";
import ClientApp from "@/ClientApp";

export const Route = createFileRoute("/support")({
  component: ClientApp,
});
