"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { registerRequest, formatBackendError } from "@/lib/authApi";
import { useAppConfig } from "@/hooks/useAppConfig";
import "./styles.css";

export default function RegisterPage() {
  const router = useRouter();
  const { config } = useAppConfig();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      displayName: "",
      learnerCode: "",
      email: "",
      gender: "",
      class: "",
      school: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = useWatch({ control, name: "password" });

  async function onSubmitData(data) {
    setError("");
    setIsSubmitting(true);

    const payload = {
      display_name: String(data.displayName || "").trim(),
      password: String(data.password || ""),
    };

    const learnerCode = String(data.learnerCode || "").trim();
    const email = String(data.email || "").trim();
    const classLevel = String(data.class || "").trim();
    const school = String(data.school || "").trim();
    const gender = String(data.gender || "").trim();

    if (learnerCode) payload.learner_code = learnerCode;
    if (email) payload.email = email;
    if (classLevel) payload.class_level = classLevel;
    if (school) payload.school_name = school;
    if (gender) payload.gender = gender;

    if (payload.password.length < 12) {
      setError("Password must be at least 12 characters.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await registerRequest(payload);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detailStr = (formatBackendError(errorData) || "").toLowerCase();
        if (
          detailStr.includes("already") ||
          detailStr.includes("exist") ||
          response.status === 409
        ) {
          throw new Error("__already_registered__");
        }
        if (response.status === 422) {
          throw new Error("__validation_error__");
        }
        throw new Error("__service_error__");
      }

      const res = await response.json();
      if (typeof window.sessionStorage !== "undefined") {
        window.sessionStorage.setItem(
          "redu.registration.codes",
          JSON.stringify({
            user: { learner_code: learnerCode || res.learner_code },
            learner_code: learnerCode || res.learner_code,
            recovery_code: res.recovery_code || res.recoveryCode || null,
            display_name: res.display_name,
          }),
        );
      }

      router.push("/login");
    } catch (err) {
      const msg = err.message || "";
      if (msg === "__config_error__") {
        setError("Service temporarily unavailable. Try again later.");
      } else if (msg === "__already_registered__") {
        setError("This account already exists. Sign in instead.");
      } else if (msg === "__validation_error__") {
        setError(
          "Check your details. Password must be at least 12 characters.",
        );
      } else if (msg === "__service_error__") {
        setError("Something went wrong. Try again later.");
      } else if (err instanceof TypeError) {
        setError("Network unavailable. Check your connection and try again.");
      } else {
        setError("Something went wrong. Try again later.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-brand" aria-label="Redu">
        <Link
          className="register-logo"
          href="/get-started"
          aria-label="Redu home"
        >
          <Image
            src="/Group 191.png"
            alt="Redu"
            width={145}
            height={80}
            priority
          />
        </Link>
        <div className="register-promo">
          <h1>
            <span>
              Join <strong>Redu</strong>
            </span>
            <span>and keep</span>
            <strong>Learning</strong>
          </h1>
          <div className="register-illustration">
            <div className="register-speech" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <Image
              src="/english-reading.png"
              alt=""
              width={510}
              height={400}
              priority
            />
          </div>
        </div>
      </section>

      <section className="register-content">
        <form className="register-card" onSubmit={handleSubmit(onSubmitData)}>
          <h2>Create an account</h2>

          <label className="register-field">
            <span>Display name *</span>
            <input
              autoComplete="name"
              {...register("displayName", {
                required: "Display name is required",
              })}
            />
            {errors.displayName && (
              <p className="field-error">{errors.displayName.message}</p>
            )}
          </label>

          <label className="register-field">
            <span>Learner code</span>
            <input autoComplete="username" {...register("learnerCode")} />
          </label>

          <label className="register-field">
            <span>Email</span>
            <input type="email" autoComplete="email" {...register("email")} />
          </label>

          <div className="register-row">
            <label className="register-field">
              <span>Gender</span>
              <select {...register("gender")}>
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="register-field">
              <span>Class</span>
              <select {...register("class")}>
                <option value="">Select</option>
                {(config?.classLevels || []).map((classLevel) => (
                  <option key={classLevel} value={classLevel}>
                    {classLevel}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="register-field">
            <span>School</span>
            <input {...register("school")} />
          </label>

          <label className="register-field">
            <span>Password *</span>
            <input
              type="password"
              autoComplete="new-password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 12,
                  message: "Password must be at least 12 characters",
                },
              })}
            />
            {errors.password && (
              <p className="field-error">{errors.password.message}</p>
            )}
          </label>

          <label className="register-field">
            <span>Confirm password *</span>
            <input
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === passwordValue || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <p className="field-error">{errors.confirmPassword.message}</p>
            )}
          </label>

          {error && (
            <p className="register-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="register-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Proceed"}
          </button>

          <p className="register-login">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
