import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";

export function Navigation() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-zinc-800/50 border-b bg-[#0d0d0d]/95 backdrop-blur-xl">
      <div className="px-6">
        <div className="flex h-20 items-center justify-between">
          <Link
            className="group flex items-center gap-3 transition-opacity hover:opacity-80"
            to="/battles"
          >
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-brand-coral to-brand-coralLight bg-clip-text font-bold text-3xl text-transparent leading-none tracking-tight">
                Rap Battles
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    className="rounded-lg bg-brand-coral px-5 py-2.5 font-semibold text-sm text-white transition-all hover:bg-brand-coralDark"
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
                      avatarBox: "h-10 w-10 ring-2 ring-brand-coral/30",
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
