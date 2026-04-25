function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.5 14.4A8.4 8.4 0 0 1 9.6 3.5 8.8 8.8 0 1 0 20.5 14.4Z" />
    </svg>
  );
}

function Header({ currentTheme, onToggleTheme }) {
  let themeButtonLabel = "Switch to light mode";
  let themeButtonTitle = "Light mode";
  let themeIcon = <MoonIcon />;

  if (currentTheme === "light") {
    themeButtonLabel = "Switch to dark mode";
    themeButtonTitle = "Dark mode";
    themeIcon = <SunIcon />;
  }

  return (
    <header className="app-header">
      <div className="brand-group">
        <img
          className="brand-logo"
          src={`${process.env.PUBLIC_URL}/sbrep2-logo.svg`}
          alt=""
        />
        <div className="brand-text">
          <span className="brand-name">sbrep2.</span>
          <span className="brand-subtitle">DOM Traversal</span>
        </div>
      </div>
      <button
        className="theme-button"
        type="button"
        onClick={onToggleTheme}
        aria-label={themeButtonLabel}
        title={themeButtonTitle}
      >
        {themeIcon}
      </button>
    </header>
  );
}

export default Header;
