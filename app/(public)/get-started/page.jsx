import Image from "next/image";
import Link from "next/link";
import "./style.css";

export default function WelcomePage() {
  return (
    <main className="welcome-page">
      <div className="welcome-photo" aria-hidden="true">
        <Image
          src="/splash.png"
          alt=""
          fill
          priority
          sizes="(max-width: 700px) 100vw, 70vw"
          className="students-image"
        />
      </div>

      <section className="welcome-card" aria-labelledby="welcome-title">
        <Image
          src="/Redusplashscreenlogo.png"
          alt="Techsus"
          width={130}
          height={170}
          priority
          className="welcome-logo"
        />

        <h1 id="welcome-title">Learn with Redu</h1>

        <p className="welcome-description">
          Clear explanations, practice and progress even when
          <br className="desktop-break" /> the network is unavailable
        </p>

        <nav className="welcome-actions" aria-label="Get started">
          <Link
            className="welcome-button welcome-button-primary"
            href="/create-account"
          >
            Get Started
          </Link>

          <Link
            className="welcome-button welcome-button-secondary"
            href="/login"
          >
            Already have an account
          </Link>
        </nav>

        <p className="welcome-note">
          Your learning stays on this device and syncs when you reconnect
        </p>
      </section>
    </main>
  );
}
