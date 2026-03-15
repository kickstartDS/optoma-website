import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { Code } from "./toolbar/Code";
import { Css } from "./toolbar/Css";
import { Load } from "./toolbar/Load";
import { Restore } from "./toolbar/Restore";
import { Save } from "./toolbar/Save";
import { SaveAs } from "./toolbar/SaveAs";

export const EditorToolbar = () => {
  return (
    <AppBar position="static">
      <Toolbar variant="dense">
        <Box
          component="img"
          src="/logo.svg"
          alt="kickstartDS"
          sx={{ height: 24, mr: 2 }}
        />
        <Restore />
        <Save />
        <SaveAs />
        <Load />
        <Code />
        <Css />
      </Toolbar>
    </AppBar>
  );
};
