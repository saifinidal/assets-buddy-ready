import { useEffect, useState, type ComponentType } from "react";
import { AppPreloader } from "@/components/AppPreloader";

export default function ClientApp() {
  const [App, setApp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await import("./i18n");
      const mod = await import("./App");
      if (mounted) setApp(() => mod.default);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!App) return <AppPreloader />;
  return <App />;
}
