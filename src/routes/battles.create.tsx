import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/battles/create")({
  component: CreateBattle,
});

function CreateBattle() {
  const navigate = useNavigate();

  // Redirect to battles list to choose theme
  useEffect(() => {
    navigate({ to: "/battles" });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <p className="text-zinc-400">Redirecting...</p>
    </div>
  );
}
