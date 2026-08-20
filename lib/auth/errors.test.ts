import { describe, expect, it } from "vitest";
import { getSignUpErrorMessage } from "./errors";

describe("getSignUpErrorMessage", () => {
  it("explains the default email authorization restriction", () => {
    expect(getSignUpErrorMessage({ code: "email_address_not_authorized" })).toContain("Custom SMTP");
  });

  it("explains email rate limits", () => {
    expect(getSignUpErrorMessage({ code: "over_email_send_rate_limit" })).toContain("giới hạn gửi email");
  });

  it("recognizes SMTP failures from older Supabase responses", () => {
    expect(getSignUpErrorMessage({ message: "Error sending confirmation email" })).toContain("Custom SMTP");
  });

  it("explains gateway timeouts from SMTP or auth hooks", () => {
    expect(getSignUpErrorMessage({ status: 504 })).toContain("smtp.gmail.com");
  });

  it("returns a safe error reference for unknown failures", () => {
    expect(getSignUpErrorMessage({ code: "unexpected_failure" })).toContain("unexpected_failure");
  });
});
