import { z } from "zod";

export const ZodUser = z.object({
  name: z.string().min(1, "name is required at least one char"),
  email: z.email(),
});
