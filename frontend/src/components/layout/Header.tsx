import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  InputBase,
  alpha,
  styled,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

interface HeaderProps {
  onMenuClick: () => void;
}

/**
 * REQUIREMENT: Modern UI with intuitive navigation
 * PURPOSE: Application header with search functionality and responsive design
 * This provides quick access to search and navigation, improving on FRED's UX
 */
const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      // REQUIREMENT: Search functionality similar to FRED
      // Navigate to search results page with the query
      window.location.href = `/explore?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
      }}
    >
      <Toolbar>
        {/* Menu button for mobile navigation */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Application title and logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}>
          <TrendingUpIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            EconGraph
          </Typography>
        </Box>

        {/* Search functionality */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Box 
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{ maxWidth: 600, width: '100%' }}
          >
            <Search
              sx={{ width: '100%' }}
            >
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search economic series..."
              inputProps={{ 'aria-label': 'search economic series' }}
              value={searchQuery}
              onChange={handleSearchChange}
            />
            </Search>
          </Box>
        </Box>

        {/* Right side actions (placeholder for future features) */}
        <Box sx={{ flexGrow: 0 }}>
          {/* Future: User menu, notifications, etc. */}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
