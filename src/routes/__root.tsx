import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Navigation } from "@/components/Navigation";

export const Route = createRootRoute({
  component: () => (
    <>
      <Navigation />
      <div className="pt-20">
        <Outlet />
      </div>
    </>
  ),
});
