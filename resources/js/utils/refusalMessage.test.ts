import { describe, expect, it } from "vitest";
import { ApiError } from "@/api";
import { refusalMessage } from "./refusalMessage";

const validationBody = {
  message: "The given data was invalid.",
  errors: { end_date: ["The end date must be after the start date."] },
};

describe("refusalMessage", () => {
  it("reads the field message off the ApiError the interceptor throws", () => {
    const refusal = new ApiError(validationBody.message, 422, validationBody);

    expect(refusalMessage(refusal)).toBe(
      "The end date must be after the start date.",
    );
  });

  it("falls back to the generic message when no field is named", () => {
    const refusal = new ApiError("This action is unauthorized.", 403, {
      message: "This action is unauthorized.",
    });

    expect(refusalMessage(refusal)).toBe("This action is unauthorized.");
  });

  it("still reads a raw axios rejection", () => {
    expect(refusalMessage({ response: { data: validationBody } })).toBe(
      "The end date must be after the start date.",
    );
  });

  it("gives nothing for a request that never reached the server", () => {
    expect(refusalMessage(new ApiError("Network Error", 0))).toBeUndefined();
  });
});
