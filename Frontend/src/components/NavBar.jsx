import { AppBar, Toolbar, Stack, Button } from "@mui/material";
import { Link } from "react-router-dom";

const buttonStyle = {
  borderRadius: "30px",
  padding: "5px 25px",
  textDecoration: "none",
  color: "white",
  fontSize: "16px",
  fontWeight: "900",
}
const toolbarStyle = {
  margin: "0 auto",
  borderRadius: "30px",
  width: "70%",
  top: "10px",
  left: "0",
  alignItems: "center"
}

function NavBar() {
  return (
    <AppBar style={{ ...toolbarStyle }} s>
      <Toolbar>
        <Stack direction="row" spacing={6}>
          <Link to="/search">
            <Button
              variant="text"
              sx={{
                ...buttonStyle,
                ":hover": {
                  bgcolor: "white",
                  color: "black",
                },
              }}
            >
              搜尋
            </Button>
          </Link>
          <Link to="/news">
            <Button
              variant="text"
              sx={{
                ...buttonStyle,
                ":hover": {
                  bgcolor: "white",
                  color: "black",
                },
              }}
            >
              動態
            </Button>
          </Link>
          <Link to="/common">
            <Button
              variant="text"
              sx={{
                ...buttonStyle,
                ":hover": {
                  bgcolor: "white",
                  color: "black",
                },
              }}
            >
              常用
            </Button>
          </Link>
        </Stack>
      </Toolbar>
    </AppBar >
  )
}

export default NavBar;