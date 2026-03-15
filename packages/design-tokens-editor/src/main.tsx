import "./init";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { LoginPage } from "./LoginPage";

const theme = createTheme({});

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
