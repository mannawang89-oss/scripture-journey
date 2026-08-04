/* Scripture Journey Reader V1 */

.reader-status-page {
  min-height: 60vh;
  padding: 90px 0;
}

.reader-error a {
  color: var(--accent);
}

.reader-page {
  min-height: calc(100vh - 76px);
  background:
    radial-gradient(circle at 15% 10%, rgba(138, 101, 75, .06), transparent 28%),
    var(--paper);
}

.reader-topbar {
  position: sticky;
  top: 76px;
  z-index: 12;
  border-bottom: 1px solid var(--line);
  background: rgba(251, 248, 242, .94);
  backdrop-filter: blur(14px);
}

.reader-topbar-inner {
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
}

.reader-selects {
  display: flex;
  align-items: center;
  gap: 22px;
}

.reader-selects label {
  display: flex;
  align-items: center;
  gap: 9px;
}

.reader-selects label > span {
  color: var(--muted);
  font-size: 12px;
}

.reader-selects select {
  min-width: 175px;
  border: 0;
  border-bottom: 1px solid var(--line);
  outline: 0;
  background: transparent;
  color: var(--ink);
  padding: 8px 24px 8px 2px;
}

.reader-selects label:last-child select {
  min-width: 110px;
}

.reader-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reader-tools button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  padding: 0 13px;
}

.reader-tools button:hover {
  background: var(--paper-deep);
  color: var(--accent);
}

.reader-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 270px;
  gap: 76px;
  align-items: start;
  padding-top: 72px;
  padding-bottom: 96px;
}

.reader-main {
  min-width: 0;
}

.reader-header {
  max-width: 760px;
  padding-bottom: 40px;
  border-bottom: 1px solid var(--line);
}

.reader-kicker,
.reader-placeholder-label,
.reader-sidebar-heading span {
  margin: 0;
  color: var(--accent);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .2em;
  text-transform: uppercase;
}

.reader-header h1 {
  margin: 13px 0 4px;
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(43px, 6vw, 72px);
  line-height: 1.15;
  letter-spacing: -.04em;
}

.reader-book-en {
  margin: 0;
  color: var(--muted);
  font-family: Georgia, serif;
  font-size: 18px;
  font-style: italic;
}

.reader-chapter-line {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 26px;
  color: var(--muted);
  font-size: 13px;
}

.reader-chapter-line i {
  width: 24px;
  height: 1px;
  background: var(--line);
}

.reader-scripture-placeholder {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 24px;
  margin: 48px 0;
  padding: 36px 0 42px;
  border-bottom: 1px solid var(--line);
}

.reader-placeholder-icon,
.reader-study-symbol {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--accent);
}

.reader-scripture-placeholder h2,
.reader-study-content h3 {
  margin: 8px 0 12px;
  font-family: 'Noto Serif SC', serif;
  font-size: 25px;
}

.reader-scripture-placeholder > div:last-child > p:last-child,
.reader-study-content > div:last-child > p:last-child {
  max-width: 660px;
  margin: 0;
  color: var(--muted);
  line-height: 1.9;
}

.reader-study-panel {
  margin-top: 18px;
}

.reader-study-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  border-bottom: 1px solid var(--line);
}

.reader-study-tabs button {
  position: relative;
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 13px 0 15px;
}

.reader-study-tabs button.active {
  color: var(--ink);
}

.reader-study-tabs button.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--accent);
}

.reader-study-content {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 24px;
  padding: 35px 0 46px;
  border-bottom: 1px solid var(--line);
}

.reader-bottom-nav {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: center;
  padding-top: 34px;
}

.reader-bottom-nav > a:not(.reader-back-link) {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
}

.reader-bottom-nav small {
  display: block;
  margin-bottom: 3px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 400;
}

.reader-next-link {
  justify-self: end;
  text-align: right;
}

.reader-back-link {
  color: var(--accent);
  font-size: 13px;
}

.reader-sidebar {
  position: sticky;
  top: 178px;
  max-height: calc(100vh - 210px);
  overflow: auto;
  padding: 24px 0 10px 26px;
  border-left: 1px solid var(--line);
}

.reader-sidebar-heading strong {
  display: block;
  margin-top: 7px;
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
}

.reader-chapter-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 7px;
  margin-top: 22px;
}

.reader-chapter-grid a {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 50%;
  color: var(--muted);
  font-size: 12px;
  transition: .18s ease;
}

.reader-chapter-grid a:hover {
  border-color: var(--line);
  color: var(--accent);
}

.reader-chapter-grid a.active {
  background: var(--accent);
  color: white;
}

@media (max-width: 900px) {
  .reader-topbar {
    top: 66px;
  }

  .reader-topbar-inner {
    align-items: stretch;
    flex-direction: column;
    padding-top: 15px;
    padding-bottom: 15px;
  }

  .reader-selects,
  .reader-tools {
    justify-content: space-between;
    width: 100%;
  }

  .reader-tools button {
    flex: 1;
    justify-content: center;
  }

  .reader-shell {
    grid-template-columns: 1fr;
    gap: 46px;
    padding-top: 54px;
  }

  .reader-sidebar {
    position: static;
    max-height: none;
    padding: 30px 0 0;
    border-top: 1px solid var(--line);
    border-left: 0;
  }

  .reader-chapter-grid {
    grid-template-columns: repeat(10, 1fr);
  }
}

@media (max-width: 620px) {
  .reader-selects {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .reader-selects label {
    justify-content: space-between;
  }

  .reader-selects select {
    min-width: 0;
    width: 72%;
  }

  .reader-tools button span {
    display: none;
  }

  .reader-header h1 {
    font-size: 42px;
  }

  .reader-scripture-placeholder,
  .reader-study-content {
    grid-template-columns: 1fr;
  }

  .reader-study-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .reader-study-tabs button {
    flex: 0 0 auto;
  }

  .reader-bottom-nav {
    grid-template-columns: 1fr 1fr;
  }

  .reader-back-link {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-self: center;
  }

  .reader-chapter-grid {
    grid-template-columns: repeat(7, 1fr);
  }
}
