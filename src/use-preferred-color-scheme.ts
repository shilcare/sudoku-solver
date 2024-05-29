import React from "react";

export const usePreferredColorScheme = () => {
  React.useEffect(() => {
    const matchDarkTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const setThemeAttribute = (e: MediaQueryListEvent) => {
      document.documentElement.setAttribute(
        "data-theme",
        e.matches ? "dark" : "light"
      );
    };

    matchDarkTheme.addEventListener("change", setThemeAttribute);
    setThemeAttribute({
      matches: matchDarkTheme.matches,
    } as MediaQueryListEvent);

    return () => {
      matchDarkTheme.removeEventListener("change", setThemeAttribute);
    };
  }, []);

  return null;
};
