import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LanguageProvider } from './i18n/LanguageContext'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { RoomsPage } from './pages/RoomsPage'
import { VehiclesPage } from './pages/VehiclesPage'
import { BoatingPage } from './pages/BoatingPage'
import {
  CafesPage,
  BeachesPage,
  BarsPage,
  FoodStreetPage,
  WhiteTownPage,
} from './pages/PlacesPages'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

const theme = createTheme({
  typography: {
    fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  },
  palette: {
    primary: { main: '#0c1419' },
    text: { primary: '#0c1419', secondary: '#5a6a74' },
  },
  shape: { borderRadius: 0 },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#f4f7f9',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#b4c4ce',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0c1419',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0c1419',
            borderWidth: 1,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          cursor: 'pointer',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          '&.Mui-selected': {
            backgroundColor: '#d5e0e6',
          },
          '&.Mui-selected:hover': {
            backgroundColor: '#d2dde4',
          },
        },
      },
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <LanguageProvider>
            <BrowserRouter>
              <Routes>
                <Route path="admin/login" element={<AdminLoginPage />} />
                <Route path="admin" element={<AdminDashboardPage />} />
                <Route element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="rooms" element={<RoomsPage />} />
                  <Route path="vehicles" element={<VehiclesPage />} />
                  <Route path="boating" element={<BoatingPage />} />
                  <Route path="cafes" element={<CafesPage />} />
                  <Route path="beaches" element={<BeachesPage />} />
                  <Route path="bars" element={<BarsPage />} />
                  <Route path="food-street" element={<FoodStreetPage />} />
                  <Route path="white-town" element={<WhiteTownPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </LanguageProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
