import { z } from "zod";

export const phoneValidationResultSchema = z.object({
  phone: z.string(),
  valid: z.boolean(),
  phone_type: z.string(),
  can_receive_sms: z.boolean(),
  carrier: z.string(),
});

export const validationResponseSchema = z.object({
  details: z.array(phoneValidationResultSchema),
  valid_count: z.number(),
  invalid_count: z.number(),
  sms_count: z.number(),
});

export type PhoneValidationResult = z.infer<typeof phoneValidationResultSchema>;
export type ValidationResponse = z.infer<typeof validationResponseSchema>;
