import { MutationCtx, QueryCtx } from "./_generated/server";

// either use QueryCtx or MutationCtx
export const verifyAuth = async (ctx: QueryCtx | MutationCtx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
        throw new Error("Unauthorized");
    }

    // return an UserIdentity const
    return identity;
};