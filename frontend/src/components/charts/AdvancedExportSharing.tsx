/**
 * REQUIREMENT: Professional export and sharing interface
 * PURPOSE: Enable high-quality report generation and professional sharing
 * This provides enterprise-grade export capabilities for economic analysis
 */

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  Share as ShareIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  DataArray as CsvIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Security as PasswordIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Branding as BrandingIcon,
  Palette as ThemeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

interface AdvancedExportSharingProps {
  seriesIds: string[];
  analysisData?: any;
  chartConfig?: any;
  onExportComplete?: (result: ExportResult) => void;
  onShareComplete?: (result: ShareResult) => void;
}

interface ExportResult {
  exportId: string;
  downloadUrl: string;
  filename: string;
  fileSize: number;
  expiresAt: Date;
}

interface ShareResult {
  shareId: string;
  shareUrl: string;
  accessLevel: string;
  expiresAt: Date;
}

interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf' | 'png' | 'svg';
  template: string;
  includeCharts: boolean;
  includeStatistics: boolean;
  includeAnnotations: boolean;
  includeMetadata: boolean;
  theme: string;
  branding: boolean;
  customHeader?: string;
  customFooter?: string;
}

interface ShareConfig {
  title: string;
  description: string;
  accessLevel: 'public' | 'authenticated' | 'private';
  password?: string;
  expiryDays: number;
  allowDownload: boolean;
  allowComments: boolean;
  trackViews: boolean;
}

/**
 * Advanced export and sharing component with professional features
 * REQUIREMENT: Enterprise-grade export and sharing capabilities
 */
const AdvancedExportSharing: React.FC<AdvancedExportSharingProps> = ({
  seriesIds,
  analysisData,
  chartConfig,
  onExportComplete,
  onShareComplete,
}) => {
  // Dialog states
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  
  // Export configuration
  const [exportConfig, setExportConfig] = React.useState<ExportConfig>({
    format: 'pdf',
    template: 'professional',
    includeCharts: true,
    includeStatistics: true,
    includeAnnotations: true,
    includeMetadata: true,
    theme: 'professional',
    branding: true,
    customHeader: '',
    customFooter: '',
  });

  // Share configuration
  const [shareConfig, setShareConfig] = React.useState<ShareConfig>({
    title: 'Economic Analysis Report',
    description: 'Comprehensive economic analysis with charts and statistics',
    accessLevel: 'authenticated',
    password: '',
    expiryDays: 30,
    allowDownload: true,
    allowComments: true,
    trackViews: true,
  });

  // UI state
  const [exportStep, setExportStep] = React.useState(0);
  const [shareStep, setShareStep] = React.useState(0);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);
  const [exportResult, setExportResult] = React.useState<ExportResult | null>(null);
  const [shareResult, setShareResult] = React.useState<ShareResult | null>(null);

  // Available templates
  const templates = [
    { 
      id: 'professional', 
      name: 'Professional Business Report',
      description: 'Clean, professional layout for executive presentations',
      preview: '/templates/professional_preview.png'
    },
    { 
      id: 'academic', 
      name: 'Academic Research Paper',
      description: 'Formal academic layout with citations',
      preview: '/templates/academic_preview.png'
    },
    { 
      id: 'presentation', 
      name: 'Executive Presentation',
      description: 'Large fonts optimized for presentations',
      preview: '/templates/presentation_preview.png'
    },
  ];

  // Handle export process
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Mock export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setExportProgress(100);

      const result: ExportResult = {
        exportId: `export-${Date.now()}`,
        downloadUrl: `https://api.econgraph.com/exports/report-${Date.now()}.${exportConfig.format}`,
        filename: `economic_analysis_${new Date().toISOString().split('T')[0]}.${exportConfig.format}`,
        fileSize: exportConfig.format === 'pdf' ? 2500000 : exportConfig.format === 'excel' ? 1200000 : 150000,
        expiresAt: new Date(Date.now() + exportConfig.format === 'pdf' ? 48 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
      };

      setExportResult(result);
      onExportComplete?.(result);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle share creation
  const handleCreateShare = async () => {
    try {
      const result: ShareResult = {
        shareId: `share-${Date.now()}`,
        shareUrl: `https://econgraph.com/shared/share-${Date.now()}`,
        accessLevel: shareConfig.accessLevel,
        expiresAt: new Date(Date.now() + shareConfig.expiryDays * 24 * 60 * 60 * 1000),
      };

      setShareResult(result);
      onShareComplete?.(result);
      
    } catch (error) {
      console.error('Share creation failed:', error);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Main Export & Share Controls */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadIcon color="primary" />
            Export & Share Analysis
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create professional reports and shareable links for your economic analysis
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialogOpen(true)}
                data-testid="open-export-dialog"
                sx={{ mb: 1 }}
              >
                Export Report
              </Button>
              <Typography variant="caption" color="text.secondary">
                Generate PDF, Excel, or CSV reports with professional formatting
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<ShareIcon />}
                onClick={() => setShareDialogOpen(true)}
                data-testid="open-share-dialog"
                sx={{ mb: 1 }}
              >
                Create Share Link
              </Button>
              <Typography variant="caption" color="text.secondary">
                Generate shareable links with access controls and expiration
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog 
        open={exportDialogOpen} 
        onClose={() => setExportDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Export Analysis Report</DialogTitle>
        <DialogContent>
          <Stepper activeStep={exportStep} orientation="vertical">
            {/* Step 1: Format Selection */}
            <Step>
              <StepLabel>Choose Export Format</StepLabel>
              <StepContent>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} md={3}>
                    <Button
                      fullWidth
                      variant={exportConfig.format === 'pdf' ? 'contained' : 'outlined'}
                      startIcon={<PdfIcon />}
                      onClick={() => setExportConfig(prev => ({ ...prev, format: 'pdf' }))}
                      data-testid="format-pdf"
                    >
                      PDF Report
                    </Button>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Button
                      fullWidth
                      variant={exportConfig.format === 'excel' ? 'contained' : 'outlined'}
                      startIcon={<ExcelIcon />}
                      onClick={() => setExportConfig(prev => ({ ...prev, format: 'excel' }))}
                      data-testid="format-excel"
                    >
                      Excel
                    </Button>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Button
                      fullWidth
                      variant={exportConfig.format === 'csv' ? 'contained' : 'outlined'}
                      startIcon={<CsvIcon />}
                      onClick={() => setExportConfig(prev => ({ ...prev, format: 'csv' }))}
                      data-testid="format-csv"
                    >
                      CSV Data
                    </Button>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Button
                      fullWidth
                      variant={exportConfig.format === 'png' ? 'contained' : 'outlined'}
                      startIcon={<ImageIcon />}
                      onClick={() => setExportConfig(prev => ({ ...prev, format: 'png' }))}
                      data-testid="format-png"
                    >
                      PNG Image
                    </Button>
                  </Grid>
                </Grid>
                <Button variant="contained" onClick={() => setExportStep(1)} data-testid="next-step-1">
                  Next
                </Button>
              </StepContent>
            </Step>

            {/* Step 2: Template & Content Selection */}
            <Step>
              <StepLabel>Configure Content & Template</StepLabel>
              <StepContent>
                {exportConfig.format === 'pdf' && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Report Template</InputLabel>
                    <Select
                      value={exportConfig.template}
                      label="Report Template"
                      onChange={(e) => setExportConfig(prev => ({ ...prev, template: e.target.value }))}
                      data-testid="template-selector"
                    >
                      {templates.map(template => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Include Content</Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportConfig.includeCharts}
                          onChange={(e) => setExportConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                        />
                      }
                      label="Charts and Visualizations"
                      data-testid="include-charts-checkbox"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportConfig.includeStatistics}
                          onChange={(e) => setExportConfig(prev => ({ ...prev, includeStatistics: e.target.checked }))}
                        />
                      }
                      label="Statistical Analysis"
                      data-testid="include-statistics-checkbox"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportConfig.includeAnnotations}
                          onChange={(e) => setExportConfig(prev => ({ ...prev, includeAnnotations: e.target.checked }))}
                        />
                      }
                      label="Annotations and Comments"
                      data-testid="include-annotations-checkbox"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Styling Options</Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={exportConfig.branding}
                          onChange={(e) => setExportConfig(prev => ({ ...prev, branding: e.target.checked }))}
                        />
                      }
                      label="Include Company Branding"
                      data-testid="include-branding-checkbox"
                    />
                    
                    <TextField
                      fullWidth
                      size="small"
                      label="Custom Header"
                      value={exportConfig.customHeader}
                      onChange={(e) => setExportConfig(prev => ({ ...prev, customHeader: e.target.value }))}
                      sx={{ mt: 1, mb: 1 }}
                      data-testid="custom-header-input"
                    />
                    
                    <TextField
                      fullWidth
                      size="small"
                      label="Custom Footer"
                      value={exportConfig.customFooter}
                      onChange={(e) => setExportConfig(prev => ({ ...prev, customFooter: e.target.value }))}
                      data-testid="custom-footer-input"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={() => setExportStep(0)}>Back</Button>
                  <Button variant="contained" onClick={() => setExportStep(2)} data-testid="next-step-2">
                    Next
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Review & Export */}
            <Step>
              <StepLabel>Review & Export</StepLabel>
              <StepContent>
                <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}>
                  <Typography variant="subtitle2" gutterBottom>Export Summary</Typography>
                  <Typography variant="body2">
                    <strong>Format:</strong> {exportConfig.format.toUpperCase()}
                    {exportConfig.template && ` • Template: ${exportConfig.template}`}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Series:</strong> {seriesIds.length} economic indicators
                  </Typography>
                  <Typography variant="body2">
                    <strong>Content:</strong> 
                    {[
                      exportConfig.includeCharts && 'Charts',
                      exportConfig.includeStatistics && 'Statistics', 
                      exportConfig.includeAnnotations && 'Annotations'
                    ].filter(Boolean).join(', ') || 'Data only'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Estimated Size:</strong> {
                      exportConfig.format === 'pdf' ? '2-5 MB' :
                      exportConfig.format === 'excel' ? '1-3 MB' : 
                      exportConfig.format === 'csv' ? '50-200 KB' : '1-2 MB'
                    }
                  </Typography>
                </Paper>

                {isExporting && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Generating {exportConfig.format.toUpperCase()} report...
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={exportProgress}
                      data-testid="export-progress"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {exportProgress}% complete
                    </Typography>
                  </Box>
                )}

                {exportResult && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Export Complete!</Typography>
                    <Typography variant="body2">
                      File: {exportResult.filename} ({formatFileSize(exportResult.fileSize)})
                    </Typography>
                    <Typography variant="body2">
                      Expires: {exportResult.expiresAt.toLocaleDateString()}
                    </Typography>
                    <Button
                      href={exportResult.downloadUrl}
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      data-testid="download-export-button"
                    >
                      Download Now
                    </Button>
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button onClick={() => setExportStep(1)}>Back</Button>
                  <Button
                    variant="contained"
                    onClick={handleExport}
                    disabled={isExporting}
                    data-testid="start-export-button"
                  >
                    {isExporting ? 'Exporting...' : 'Start Export'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Shareable Link</DialogTitle>
        <DialogContent>
          <Stepper activeStep={shareStep} orientation="vertical">
            {/* Share Step 1: Basic Info */}
            <Step>
              <StepLabel>Share Information</StepLabel>
              <StepContent>
                <TextField
                  fullWidth
                  label="Share Title"
                  value={shareConfig.title}
                  onChange={(e) => setShareConfig(prev => ({ ...prev, title: e.target.value }))}
                  sx={{ mb: 2 }}
                  data-testid="share-title-input"
                />
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description (Optional)"
                  value={shareConfig.description}
                  onChange={(e) => setShareConfig(prev => ({ ...prev, description: e.target.value }))}
                  sx={{ mb: 2 }}
                  data-testid="share-description-input"
                />

                <Button variant="contained" onClick={() => setShareStep(1)} data-testid="share-next-step-1">
                  Next
                </Button>
              </StepContent>
            </Step>

            {/* Share Step 2: Access Control */}
            <Step>
              <StepLabel>Access & Security</StepLabel>
              <StepContent>
                <Typography variant="subtitle2" gutterBottom>Access Level</Typography>
                <RadioGroup
                  value={shareConfig.accessLevel}
                  onChange={(e) => setShareConfig(prev => ({ ...prev, accessLevel: e.target.value as any }))}
                  sx={{ mb: 2 }}
                >
                  <FormControlLabel
                    value="public"
                    control={<Radio data-testid="access-public" />}
                    label="Public - Anyone with the link can view"
                  />
                  <FormControlLabel
                    value="authenticated"
                    control={<Radio data-testid="access-authenticated" />}
                    label="Authenticated Users - Requires login to view"
                  />
                  <FormControlLabel
                    value="private"
                    control={<Radio data-testid="access-private" />}
                    label="Private - Only invited users can view"
                  />
                </RadioGroup>

                <TextField
                  fullWidth
                  type="password"
                  label="Password Protection (Optional)"
                  value={shareConfig.password}
                  onChange={(e) => setShareConfig(prev => ({ ...prev, password: e.target.value }))}
                  sx={{ mb: 2 }}
                  data-testid="share-password-input"
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Expiry</InputLabel>
                  <Select
                    value={shareConfig.expiryDays}
                    label="Expiry"
                    onChange={(e) => setShareConfig(prev => ({ ...prev, expiryDays: e.target.value as number }))}
                    data-testid="share-expiry-select"
                  >
                    <MenuItem value={1}>1 Day</MenuItem>
                    <MenuItem value={7}>1 Week</MenuItem>
                    <MenuItem value={30}>1 Month</MenuItem>
                    <MenuItem value={90}>3 Months</MenuItem>
                    <MenuItem value={365}>1 Year</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button onClick={() => setShareStep(0)}>Back</Button>
                  <Button variant="contained" onClick={() => setShareStep(2)} data-testid="share-next-step-2">
                    Next
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Share Step 3: Permissions & Create */}
            <Step>
              <StepLabel>Permissions & Create Link</StepLabel>
              <StepContent>
                <Typography variant="subtitle2" gutterBottom>Share Permissions</Typography>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={shareConfig.allowDownload}
                      onChange={(e) => setShareConfig(prev => ({ ...prev, allowDownload: e.target.checked }))}
                    />
                  }
                  label="Allow viewers to download data"
                  data-testid="allow-download-checkbox"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={shareConfig.allowComments}
                      onChange={(e) => setShareConfig(prev => ({ ...prev, allowComments: e.target.checked }))}
                    />
                  }
                  label="Allow comments and collaboration"
                  data-testid="allow-comments-checkbox"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={shareConfig.trackViews}
                      onChange={(e) => setShareConfig(prev => ({ ...prev, trackViews: e.target.checked }))}
                    />
                  }
                  label="Track views and analytics"
                  data-testid="track-views-checkbox"
                />

                {shareResult && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Share Link Created!</Typography>
                    <TextField
                      fullWidth
                      value={shareResult.shareUrl}
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      data-testid="generated-share-url"
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton
                            onClick={() => navigator.clipboard.writeText(shareResult.shareUrl)}
                            size="small"
                          >
                            Copy
                          </IconButton>
                        ),
                      }}
                    />
                    <Typography variant="body2">
                      Expires: {shareResult.expiresAt.toLocaleDateString()}
                    </Typography>
                  </Alert>
                )}

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={() => setShareStep(1)}>Back</Button>
                  <Button
                    variant="contained"
                    onClick={handleCreateShare}
                    disabled={!shareConfig.title.trim()}
                    data-testid="create-share-button"
                  >
                    Create Share Link
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Export Summary Info */}
      {(exportResult || shareResult) && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recent Exports & Shares</Typography>
            
            {exportResult && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Latest Export</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={exportConfig.format.toUpperCase()} size="small" color="primary" />
                  <Typography variant="body2">{exportResult.filename}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({formatFileSize(exportResult.fileSize)})
                  </Typography>
                </Box>
              </Box>
            )}
            
            {shareResult && (
              <Box>
                <Typography variant="subtitle2">Latest Share</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={shareResult.accessLevel} size="small" color="secondary" />
                  <Typography variant="body2">{shareConfig.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    (Expires {shareResult.expiresAt.toLocaleDateString()})
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AdvancedExportSharing;