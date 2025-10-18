import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";

export function Navigation() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-white/5 border-b bg-zinc-950/80 backdrop-blur-xl">
      <div className="px-6">
        <div className="flex h-20 items-center justify-between">
          <Link
            className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105"
            to="/battles"
          >
            <div className="flex flex-col">
              <span className="font-bold text-2xl text-zinc-50 leading-none tracking-tight">
                Rap Battles
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    className="rounded-full bg-white/10 px-4 py-2 font-medium text-sm text-zinc-50 transition-colors hover:bg-white/20"
                    type="button"
                  >
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                    },
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
