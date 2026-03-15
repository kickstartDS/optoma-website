import "./init";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { LoginPage } from "./LoginPage";
import "@kickstartds/design-system/tokens/tokens.css";
import * as tokens from "@kickstartds/design-system/tokens/tokens.js";

const pxToNumber = (px: string) => Number(px.replace("px", ""));

export const theme = createTheme({
  palette: {
    primary: { main: tokens.KsColorPrimaryBase },
    background: {
      default: tokens.KsColorPrimaryToBg9Base,
      paper: tokens.KsBackgroundColorDefaultBase,
    },
    text: {
      primary: tokens.KsTextColorDefaultBase,
      secondary: tokens.KsColorFgAlpha3Base,
    },
    divider: tokens.KsColorFgToBg7Base,
  },
  typography: {
    fontFamily: tokens.KsFontFamilyInterface,
    fontSize: 14,
    button: {
      textTransform: "none" as const,
    },
  },
  shape: {
    borderRadius: pxToNumber(tokens.KsBorderRadiusControl),
  },
  components: {
    MuiGrid: {
      styleOverrides: {
        root: {
          "--Grid-columnSpacing": "0.5em",
          "--Grid-rowSpacing": "0.5em",
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          position: "sticky",
          top: 0,
          zIndex: 2,
          backgroundImage: "none",
          backgroundColor: tokens.KsBackgroundColorDefaultBase,
          color: tokens.KsTextColorDefaultBase,
          borderBottom: `1px solid ${tokens.KsColorFgToBg7Base}`,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none" as const,
          fontWeight: 500,
          fontSize: "0.875rem",
          minHeight: 44,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: "3px 3px 0 0",
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        dense: {
          minHeight: 44,
        },
      },
    },
  },
});

type AuthState = "loading" | "authenticated" | "unauthenticated";

function Root() {
  const [auth, setAuth] = useState<AuthState>("loading");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => setAuth(res.ok ? "authenticated" : "unauthenticated"))
      .catch(() => setAuth("unauthenticated"));
  }, []);

  if (auth === "loading") return null;
  if (auth === "unauthenticated")
    return <LoginPage onLogin={() => setAuth("authenticated")} />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <Root />
    </ThemeProvider>
  </React.StrictMode>,
);
