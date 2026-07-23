import { z } from "zod";

export const slug = z
  .string()
  .min(1, "El identificador es obligatorio")
  .regex(/^[a-z0-9-]+$/, "El identificador debe contener solo minúsculas, números y guiones");
