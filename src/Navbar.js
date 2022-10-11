import React, {} from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

function Navbar() {
  const loc = useLocation();
  

  return (
    <AppBar
      position="static"
      color="inherit"
      sx={{
        flexGrow: 1,
        marginBottom: 3,
        padding: 0.5,
        boxShadow:"none",
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <Toolbar variant="dense">
        <Link
          // variant="h6"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            ':hover': {
              textDecoration: 'none',
            },
          }}
          // underline="none"
          color="inherit"
          component={RouterLink}
          to="/"
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              '& *': { mr: 1, my: 0.5 },
            }}
          >
            <img
              src={process.env.PUBLIC_URL + "/images/hcs_edconnect_logo.png"}
              style={{ display: "inline-block"}}
              height={50}
              alt="hcs edconnect logo"
            />
            <Typography variant="h6">
              EdConnect Evaluation Study
            </Typography>
          </Box>
        </Link>
        
        <Button
          color={loc.pathname === "/" ? "primary" : "inherit"}
          component={RouterLink}
          to="/"
        >
          <Typography variant="button">Home</Typography>
        </Button>
        <Button
          color={loc.pathname === "/Conferences" ? "primary" : "inherit"}
          component={RouterLink}
          to="/Conferences"
        >
          <Typography variant="button">Conferences</Typography>
        </Button>
        <Button
          color={loc.pathname === "/Guidelines" ? "primary" : "inherit"}
          component={RouterLink}
          to="/Guidelines"
        >
          <Typography variant="button">Guidelines</Typography>
        </Button>
        <Button
          color={loc.pathname === "/Contact" ? "primary" : "inherit"}
          component={RouterLink}
          to="/Contact"
        >
          <Typography variant="button">Contact</Typography>
        </Button>
        
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;