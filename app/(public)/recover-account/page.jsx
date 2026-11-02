"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  requestRecovery,
  completeRecovery,
  formatBackendError,
} from "@/lib/authApi";
import "./styles.css";

export default function RecoverAccountPage() {
  const router = useRouter();
  const [step, setStep] = useState("request");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { register: registerRequestForm, handleSubmit: handleSubmitRequest } =
    useForm({
      defaultValues: { learnerCode: "", email: "" },
    });

  const {
    register: registerResetForm,
    handleSubmit: handleSubmitReset,
    control: resetControl,
    formState: { errors: resetErrors },
  } = useForm({
    defaultValues: { token: "", newPassword: "", confirmPassword: "" },
  });

  const newPasswordValue = useWatch({
    control: resetControl,
    name: "newPassword",
  });

  async function onExecuteRequest(data) {
    setError("");
    setSuccessMessage("");

    if (
      !String(data.learnerCode ?? "").trim() &&
      !String(data.email ?? "").trim()
    ) {
      setError("Enter your learner code or email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestRecovery({
        learner_code: String(data.learnerCode ?? "").trim() || undefined,
        email: String(data.email ?? "").trim() || undefined,
      });

      if (!response.ok) {
        throw new Error("__service_error__");
      }

      setSuccessMessage(
        "If an account matches those details, a recovery code has been sent.",
      );
      setStep("reset");
    } catch (err) {
      const msg = err.message || "";
      if (msg === "__config_error__") {
        setError("Service temporarily unavailable. Try again later.");
      } else if (msg === "__service_error__") {
        setError("Something went wrong. Try again later.");
      } else if (err instanceof TypeError) {
        setError("Network unavailable. Check your connection and try again.");
      } else {
        setError("Something went wrong. Try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onExecuteReset(data) {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await completeRecovery({
        token: String(data.token ?? "").trim(),
        new_password: String(data.newPassword ?? ""),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detailStr = (formatBackendError(errorData) || "").toLowerCase();
        if (
          detailStr.includes("invalid") ||
          detailStr.includes("expired") ||
          detailStr.includes("not found") ||
          response.status === 404
        ) {
          throw new Error("__invalid_recovery__");
        }
        throw new Error("__service_error__");
      }

      router.push("/login");
    } catch (err) {
      const msg = err.message || "";
      if (msg === "__config_error__") {
        setError("Service temporarily unavailable. Try again later.");
      } else if (msg === "__invalid_recovery__") {
        setError("Invalid or expired recovery code. Request a new one.");
      } else if (msg === "__service_error__") {
        setError("Something went wrong. Try again later.");
      } else if (err instanceof TypeError) {
        setError("Network unavailable. Check your connection and try again.");
      } else {
        setError("Something went wrong. Try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="recover-page">
      {step === "request" ? (
        <form
          className="recover-card"
          onSubmit={handleSubmitRequest(onExecuteRequest)}
        >
          <h2>Recover account</h2>
          <p className="recover-hint">
            Enter your learner code or email to request a recovery code.
          </p>

          <label className="recover-field">
            <span>Learner code</span>
            <input type="text" {...registerRequestForm("learnerCode")} />
          </label>

          <label className="recover-field">
            <span>Email</span>
            <input type="email" {...registerRequestForm("email")} />
          </label>

          {error && (
            <p className="recover-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Requesting..." : "Request recovery code"}
          </button>

          <p>
            <Link href="/login">Back to login</Link>
          </p>
        </form>
      ) : (
        <form
          className="recover-card"
          onSubmit={handleSubmitReset(onExecuteReset)}
        >
          <h2>Reset password</h2>
          {successMessage && (
            <p className="recover-success" role="status">
              {successMessage}
            </p>
          )}
          <p className="recover-hint">
            Enter the recovery code you received and choose a new password.
          </p>

          <label className="recover-field">
            <span>Recovery code</span>
            <input
              type="text"
              {...registerResetForm("token", {
                required: "Recovery code is required",
              })}
            />
            {resetErrors.token && (
              <p className="field-error">{resetErrors.token.message}</p>
            )}
          </label>

          <label className="recover-field">
            <span>New password</span>
            <input
              type="password"
              {...registerResetForm("newPassword", {
                required: "New password is required",
              })}
            />
            {resetErrors.newPassword && (
              <p className="field-error">{resetErrors.newPassword.message}</p>
            )}
          </label>

          <label className="recover-field">
            <span>Confirm new password</span>
            <input
              type="password"
              {...registerResetForm("confirmPassword", {
                required: "Please confirm your new password",
                validate: (value) =>
                  value === newPasswordValue || "Passwords do not match",
              })}
            />
            {resetErrors.confirmPassword && (
              <p className="field-error">
                {resetErrors.confirmPassword.message}
              </p>
            )}
          </label>

          {error && (
            <p className="recover-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset password"}
          </button>

          <p>
            <Link href="/login">Back to login</Link>
          </p>
        </form>
      )}
    </main>
  );
}
