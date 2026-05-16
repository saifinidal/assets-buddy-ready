import "./i18n";
import App from "./App";

export default function ClientApp() {
  const initialEntry =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : "/";

  return <App initialEntry={initialEntry} />;
}
