import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, Box } from '@mui/material';

import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import SeriesExplorer from './pages/SeriesExplorer';
import SeriesDetail from './pages/SeriesDetail';
import DataSources from './pages/DataSources';
import About from './pages/About';
import ProfessionalAnalysis from './pages/ProfessionalAnalysis';
import GlobalAnalysis from './pages/GlobalAnalysis';

// Enterprise Features
import MultiSeriesComparison from './components/charts/MultiSeriesComparison';
import StatisticalAnalysisPanel from './components/charts/StatisticalAnalysisPanel';
import RealTimeCollaboration from './components/charts/RealTimeCollaboration';
import AdvancedExportSharing from './components/charts/AdvancedExportSharing';
import PerformanceDashboard from './components/dashboard/PerformanceDashboard';
import CustomizableDashboard from './components/dashboard/CustomizableDashboard';

/**
 * REQUIREMENT: Modern application that is easier to use than FRED
 * PURPOSE: Main application component that provides routing and layout structure
 * This creates a responsive layout with navigation that's more intuitive than FRED's interface
 */
function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AuthProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* REQUIREMENT: Modern responsive design */}
        <Header onMenuClick={handleSidebarToggle} />

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
        <Box
          component='main'
          sx={{
            flexGrow: 1,
            pt: { xs: 7, sm: 8 }, // Account for header height
            pl: { sm: sidebarOpen ? 30 : 0 }, // Account for sidebar when open
            transition: 'padding-left 0.3s ease',
          }}
        >
          <Container maxWidth='xl' sx={{ py: 3 }}>
            <Routes>
              {/* REQUIREMENT: Function similarly to FRED but with modern UX */}
              <Route path='/' element={<Dashboard />} />
              <Route path='/explore' element={<SeriesExplorer />} />
              <Route path='/series/:id' element={<SeriesDetail />} />
              <Route path='/sources' element={<DataSources />} />
              <Route path='/about' element={<About />} />
              <Route path='/analysis/:id?' element={<ProfessionalAnalysis />} />
              <Route path='/global' element={<GlobalAnalysis />} />
              
              {/* Enterprise Features - Bloomberg Terminal-Level Tools */}
              <Route 
                path='/comparison' 
                element={
                  <MultiSeriesComparison 
                    seriesIds={['gdp-real', 'unemployment-rate']}
                    onSeriesAdd={() => {}}
                    onSeriesRemove={() => {}}
                    onTransformationChange={() => {}}
                  />
                } 
              />
              <Route 
                path='/statistical-analysis' 
                element={
                  <StatisticalAnalysisPanel 
                    seriesIds={['gdp-real', 'unemployment-rate']}
                    onExport={() => {}}
                    onSave={() => {}}
                  />
                } 
              />
              <Route 
                path='/collaboration' 
                element={
                  <RealTimeCollaboration 
                    chartId='main-chart'
                    currentUserId='demo-user'
                    onAnnotationAdd={() => {}}
                    onInviteUser={() => {}}
                  />
                } 
              />
              <Route 
                path='/export-sharing' 
                element={
                  <AdvancedExportSharing 
                    seriesIds={['gdp-real', 'unemployment-rate']}
                    onExportComplete={() => {}}
                    onShareComplete={() => {}}
                  />
                } 
              />
              <Route path='/performance' element={<PerformanceDashboard />} />
              <Route 
                path='/custom-dashboard' 
                element={
                  <CustomizableDashboard 
                    userId='demo-user'
                    onSaveDashboard={() => {}}
                    onLoadDashboard={() => {}}
                  />
                } 
              />
            </Routes>
          </Container>
        </Box>
      </Box>
    </AuthProvider>
  );
}

export default App;
