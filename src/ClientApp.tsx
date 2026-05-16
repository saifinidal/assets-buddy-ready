import "./i18n";
import { useRouterState } from "@tanstack/react-router";
import App from "./App";

export default function ClientApp() {
  const location = useRouterState({
    select: (state) => state.location,
  });

  const initialEntry = `${location.pathname}${location.search?.str ?? ""}${location.hash ?? ""}`;

  return <App initialEntry={initialEntry} />;
}
