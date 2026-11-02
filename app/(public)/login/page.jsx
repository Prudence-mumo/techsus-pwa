"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { setSession, resolveUserClass, resolveUserName } from "@/lib/session";
import {
  loginRequest,
  getCurrentUser,
  formatBackendError,
} from "@/lib/authApi";
import "./style.css";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      learnerCode: "",
      email: "",
      password: "",
    },
  });

  async function onSubmitData(data) {
    setError("");

    const learnerCode = String(data.learnerCode ?? "").trim();
    const email = String(data.email ?? "").trim();
    const password = String(data.password ?? "");

    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (!learnerCode && !email) {
      setError("Enter your learner code or email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginRequest({
        learner_code: learnerCode || undefined,
        email: email || undefined,
        password,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 404) {
          const msg = formatBackendError(errorData);
          throw new Error(
            msg ? `__invalid_credentials__:${msg}` : "__invalid_credentials__",
          );
        }
        const msg = formatBackendError(errorData);
        throw new Error(msg ? `__service_error__:${msg}` : "__service_error__");
      }

      const resData = await response.json();
      if (resData.access_token) {
        localStorage.setItem("authToken", resData.access_token);
        try {
          await setSession({ userId: null, token: resData.access_token });
        } catch {}
      }

      const meResponse = await getCurrentUser(resData.access_token);

      if (!meResponse.ok) {
        if (meResponse.status === 401) {
          setError("Session expired. Please log in again.");
          setIsSubmitting(false);
          return;
        }
        setError("Unable to load your profile. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const me = await meResponse.json().catch(() => ({}));
      if (!me || Object.keys(me).length === 0) {
        setError("Unable to load your profile. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const role = String(me.role || "").toUpperCase();
      const userId = me.user_id || me.id || me.sub || null;
      const sessionUserName = resolveUserName(me);
      const sessionUserClass = resolveUserClass(me);
      if (resData.access_token) {
        try {
          await setSession({
            userId,
            token: resData.access_token,
            userName: sessionUserName,
            userClass: sessionUserClass,
          });
        } catch {}
      }

      if (role === "ADMIN" || role === "ADMINISTRATOR") {
        router.push("/admin");
      } else {
        router.push("/learn");
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.startsWith("__config_error__")) {
        setError("Service temporarily unavailable. Try again later.");
      } else if (msg.startsWith("__invalid_credentials__")) {
        const detail = msg.slice("__invalid_credentials__:".length);
        setError(
          detail ||
            "Invalid credentials. Please check your learner code and password.",
        );
      } else if (msg.startsWith("__service_error__")) {
        const detail = msg.slice("__service_error__:".length);
        setError(detail || "Something went wrong. Try again later.");
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
    <main className="login-screen">
      <section className="login-left" aria-label="Redu learning">
        <Link
          className="login-brand"
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

        <div className="login-promo">
          <h1>
            <strong>Learn</strong>
            <span>
              Further <strong>today</strong>
            </span>
          </h1>

          <Image
            className="login-book-art"
            src="/english-reading.png"
            alt=""
            width={410}
            height={320}
            priority
          />
        </div>
      </section>

      <section className="login-right" aria-label="Sign in">
        <form className="login-form-card" onSubmit={handleSubmit(onSubmitData)}>
          <h2>Welcome Back</h2>

          <label className="login-field">
            <span>Learner Code</span>
            <input autoComplete="username" {...register("learnerCode")} />
          </label>

          <label className="login-field">
            <span>Email</span>
            <input type="email" autoComplete="email" {...register("email")} />
          </label>

          <label className="login-field login-password-field">
            <span>Password</span>
            <span className="login-password-control">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                {...register("password")}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </span>
          </label>

          <div className="login-forgot">
            <Link href="/recover-account">Forgot Password?</Link>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="login-button login-button-primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          <p className="login-register">
            New to Redu? <Link href="/create-account">Create an account</Link>
          </p>
        </form>

        <Image
          className="login-offline-art"
          src="/physics-circuit.png"
          alt=""
          width={150}
          height={130}
        />
      </section>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m3 3 18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.4 0 10 6 10 6a16 16 0 0 1-3.2 3.7M6.2 6.7C3.5 8.3 2 12 2 12s3.6 6 10 6c1 0 2-.2 2.8-.5M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
