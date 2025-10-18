import { Webhook } from "svix";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!(svixId && svixTimestamp && svixSignature)) {
      return new Response("Missing Svix headers", { status: 400 });
    }

    const payload = await req.text();
    const body = JSON.parse(payload);

    const webhook = new Webhook(webhookSecret);

    try {
      webhook.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }

    const eventType = body.type;
    const userData = body.data;

    switch (eventType) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.users.upsertUser, {
          clerkId: userData.id,
          email: userData.email_addresses[0]?.email_address,
          firstName: userData.first_name,
          lastName: userData.last_name,
          imageUrl: userData.image_url,
        });
        break;

      case "user.deleted":
        await ctx.runMutation(internal.users.deleteUser, {
          clerkId: userData.id,
        });
        break;

      default:
        break;
    }

    return new Response("Webhook processed", { status: 200 });
  }),
});

export default http;
