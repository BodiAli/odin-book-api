import z from "zod";

export default function addBinaryField(
  schema: z.ZodObject,
  fieldName: string,
  isOptional: boolean,
): z.ZodType {
  if (isOptional) {
    return schema.extend({
      [fieldName]: z
        .string()
        .openapi({ type: "string", format: "binary" })
        .optional(),
    });
  }

  return schema.extend({
    [fieldName]: z.string().openapi({ type: "string", format: "binary" }),
  });
}
