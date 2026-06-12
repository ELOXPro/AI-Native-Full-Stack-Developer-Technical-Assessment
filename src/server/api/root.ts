import { postRouter } from "@/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

// Root router mounting all API sub-routers.
export const appRouter = createTRPCRouter({
  post: postRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

// Server-side procedure execution caller.
export const createCaller = createCallerFactory(appRouter);
