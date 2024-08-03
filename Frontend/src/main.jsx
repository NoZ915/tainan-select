import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";

import {
  createTheme,
  ThemeProvider
} from "@mui/material";

import App from './App.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {

      }
    ]
  }
])

const theme = createTheme({
  palette: {
    primary: {
      main: "#c92d2d"
    },
    secondary: {
      main: "#f2bbbb"
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)
