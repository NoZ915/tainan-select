import { AppBar, Toolbar, Stack, Button } from "@mui/material";
import { Link } from "react-router-dom";

function NavBar() {
  return (
    <AppBar>
      <Toolbar>
        <Stack direction="row" spacing={6}>
          <Button>
            <Link>搜尋</Link>
          </Button>
          <Button>
            <Link>動態</Link>
          </Button>
          <Button>
            <Link>常用</Link>
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default NavBar;