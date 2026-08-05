.bible-directory-page {
  min-height: 70vh;
}

.bible-directory-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 34px;
}

.bible-directory-header .section-heading {
  margin-bottom: 0;
}

.bible-directory-search {
  width: min(320px, 100%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
}

.bible-directory-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
}

.bible-directory-search input::placeholder {
  color: var(--muted);
}

.bible-directory-filter {
  display: flex;
  gap: 26px;
  margin-bottom: 62px;
  border-bottom: 1px solid var(--line);
}

.bible-directory-filter button {
  position: relative;
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 0 0 14px;
  font-size: 14px;
}

.bible-directory-filter button:hover,
.bible-directory-filter button.active {
  color: var(--accent);
}

.bible-directory-filter button.active::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--accent);
}

.bible-directory-content {
  display: grid;
  gap: 76px;
}

.bible-directory-section {
  max-width: 960px;
}

.bible-directory-section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--ink);
}

.bible-directory-section-heading p {
  margin: 0 0 7px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .2em;
}

.bible-directory-section-heading h2 {
  margin: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 31px;
  font-weight: 600;
}

.bible-directory-section-heading > span {
  padding-bottom: 4px;
  color: var(--muted);
  font-size: 13px;
}

.bible-directory-list {
  border-bottom: 1px solid var(--line);
}

.bible-directory-row {
  min-height: 72px;
  display: grid;
  grid-template-columns: 46px minmax(150px, 240px) minmax(30px, 1fr) 72px 28px;
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid var(--line);
  transition:
    color .2s ease,
    padding .2s ease,
    background .2s ease;
}

.bible-directory-row:last-child {
  border-bottom: 0;
}

.bible-directory-row:hover {
  padding-right: 10px;
  padding-left: 10px;
  background: rgba(251, 248, 242, .7);
  color: var(--accent);
}

.bible-directory-number {
  color: var(--muted);
  font-family: Georgia, serif;
  font-size: 12px;
  letter-spacing: .08em;
}

.bible-directory-name {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.bible-directory-name strong {
  min-width: 80px;
  font-family: 'Noto Serif SC', serif;
  font-size: 19px;
  font-weight: 600;
}

.bible-directory-name small {
  color: var(--muted);
  font-family: Georgia, serif;
  font-size: 14px;
  font-style: italic;
}

.bible-directory-dots {
  height: 1px;
  border-top: 1px dotted rgba(116, 107, 98, .55);
}

.bible-directory-chapters {
  color: var(--muted);
  font-size: 13px;
  text-align: right;
  white-space: nowrap;
}

.bible-directory-arrow {
  display: flex;
  justify-content: flex-end;
  color: var(--accent);
  opacity: .62;
  transition:
    opacity .2s ease,
    transform .2s ease;
}

.bible-directory-row:hover .bible-directory-arrow {
  opacity: 1;
  transform: translateX(4px);
}

.bible-directory-status {
  padding: 56px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  color: var(--muted);
}

@media (max-width: 760px) {
  .bible-directory-header {
    align-items: stretch;
    flex-direction: column;
  }

  .bible-directory-search {
    width: 100%;
  }

  .bible-directory-filter {
    margin-bottom: 46px;
  }

  .bible-directory-row {
    min-height: 76px;
    grid-template-columns: 32px minmax(0, 1fr) auto 22px;
    gap: 12px;
  }

  .bible-directory-name {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .bible-directory-name strong {
    min-width: 0;
    font-size: 18px;
  }

  .bible-directory-dots {
    display: none;
  }

  .bible-directory-chapters {
    font-size: 12px;
  }
}

@media (max-width: 440px) {
  .bible-directory-section-heading h2 {
    font-size: 27px;
  }

  .bible-directory-row {
    grid-template-columns: minmax(0, 1fr) auto 20px;
  }

  .bible-directory-number {
    display: none;
  }
}
