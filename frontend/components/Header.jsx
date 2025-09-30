"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

export default function Header({ me, onLogout }) {
  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Go to timeline">
          <span className={styles.logoWrap} aria-hidden="true">
            <Image
              src="/logo/sociAubrick.png"
              alt="SociAubrick"
              width={260}
              height={260}
              priority
              className={styles.logo}
            />
          </span>
          <span className={styles.brandName}>School Social</span>
        </Link>

        <div className={styles.right}>
          {!me ? (
            <Link href="/signin" className="btn secondary">
              Sign in
            </Link>
          ) : (
            <>
              {me?.avatar && (
                <Link
                  href={`/u/${me.id}`}
                  className={styles.avatarLink}
                  title="My profile">
                  <img
                    className="avatar"
                    src={me.avatar?.startsWith("http") ? me.avatar : me.avatar}
                    alt="me"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </Link>
              )}
              <Link
                href={`/u/${me?.id || ""}`}
                className="btn-link"
                title="My profile">
                <span>
                  {me?.username} • {me?.role}
                </span>
              </Link>
              <button className="btn secondary" onClick={onLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
