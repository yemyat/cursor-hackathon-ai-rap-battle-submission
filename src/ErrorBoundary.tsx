import { Component, type ReactNode } from "react";
import { Code } from "@/components/typography/code";
import { Link } from "@/components/typography/link";

// NOTE: Once you get Clerk working you can simplify this error boundary
// or remove it entirely.
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: ReactNode | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    const errorText = "" + (error as any).toString();
    if (
      errorText.includes("@clerk/clerk-react") &&
      errorText.includes("publishableKey")
    ) {
      const [clerkDashboardUrl] = errorText.match(/https:\S+/) ?? [];
      return {
        error: (
          <>
            <p>
              Add{" "}
              <Code>
                VITE_CLERK_PUBLISHABLE_KEY="{"<"}your publishable key{">"}"
              </Code>{" "}
              to the <Code>.env.local</Code> file
            </p>
            {clerkDashboardUrl ? (
              <p>
                You can find it at{" "}
                <Link href={clerkDashboardUrl} target="_blank">
                  {clerkDashboardUrl}
                </Link>
              </p>
            ) : null}
            <p className="pl-8 text-muted-foreground">Raw error: {errorText}</p>
          </>
        ),
      };
    }

    return { error: <p>{errorText}</p> };
  }

  componentDidCatch() {}

  render() {
    if (this.state.error !== null) {
      return (
        <div className="container flex flex-col gap-4 bg-red-100 p-8">
          <h1 className="font-bold text-xl">
            Caught an error while rendering:
          </h1>
          {this.state.error}
        </div>
      );
    }

    return this.props.children;
  }
}
