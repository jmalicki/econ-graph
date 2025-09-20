import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Badge,
  Button,
  Progress,
  Alert,
  AlertDescription,
} from '@/components/ui';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  Users,
  MessageSquare,
  BookOpen,
  Lightbulb,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GET_FINANCIAL_STATEMENT,
  GET_FINANCIAL_RATIOS,
  GET_ANNOTATIONS,
  CREATE_ANNOTATION,
  ANNOTATION_ADDED_SUBSCRIPTION,
} from '@/graphql/financial';
import { FinancialStatement, FinancialRatios, FinancialAnnotation } from '@/types/financial';
import { AnnotationPanel } from './AnnotationPanel';
import { RatioAnalysisPanel } from './RatioAnalysisPanel';
import { EducationalPanel } from './EducationalPanel';
import { CollaborativePresence } from './CollaborativePresence';

interface FinancialStatementViewerProps {
  statementId: string;
  companyId: string;
  userType?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  showEducationalContent?: boolean;
  showCollaborativeFeatures?: boolean;
}

export const FinancialStatementViewer: React.FC<FinancialStatementViewerProps> = ({
  statementId,
  companyId,
  userType = 'intermediate',
  showEducationalContent = true,
  showCollaborativeFeatures = true,
}) => {
  const [activeTab, setActiveTab] = useState('statement');
  const [selectedLineItem, setSelectedLineItem] = useState<string | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showRatios, setShowRatios] = useState(false);
  const [showEducational, setShowEducational] = useState(false);

  // GraphQL queries
  const { data: statementData, loading: statementLoading, error: statementError } = useQuery(
    GET_FINANCIAL_STATEMENT,
    {
      variables: { id: statementId },
      fetchPolicy: 'cache-and-network',
    }
  );

  const { data: ratiosData, loading: ratiosLoading } = useQuery(
    GET_FINANCIAL_RATIOS,
    {
      variables: { statementId },
      skip: !showRatios,
    }
  );

  const { data: annotationsData, loading: annotationsLoading } = useQuery(
    GET_ANNOTATIONS,
    {
      variables: { statementId },
      skip: !showAnnotations,
    }
  );

  // Real-time subscription for new annotations
  const { data: newAnnotationData } = useSubscription(
    ANNOTATION_ADDED_SUBSCRIPTION,
    {
      variables: { statementId },
      skip: !showCollaborativeFeatures,
    }
  );

  // Mutations
  const [createAnnotation] = useMutation(CREATE_ANNOTATION);

  const statement: FinancialStatement | undefined = statementData?.financialStatement;
  const ratios: FinancialRatios | undefined = ratiosData?.financialRatios;
  const annotations: FinancialAnnotation[] = annotationsData?.annotations || [];

  // Handle new annotation from subscription
  useEffect(() => {
    if (newAnnotationData?.annotationAdded) {
      // Update local state or refetch annotations
      console.log('New annotation added:', newAnnotationData.annotationAdded);
    }
  }, [newAnnotationData]);

  if (statementLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Progress value={33} className="w-full max-w-md" />
        <span className="ml-4">Loading financial statement...</span>
      </div>
    );
  }

  if (statementError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading financial statement: {statementError.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!statement) {
    return (
      <Alert>
        <AlertDescription>
          Financial statement not found.
        </AlertDescription>
      </Alert>
    );
  }

  const handleLineItemClick = (lineItemId: string) => {
    setSelectedLineItem(selectedLineItem === lineItemId ? null : lineItemId);
    if (showCollaborativeFeatures) {
      setShowAnnotations(true);
    }
  };

  const handleAddAnnotation = async (content: string, type: string, lineItemId?: string) => {
    try {
      await createAnnotation({
        variables: {
          input: {
            statementId,
            lineItemId,
            content,
            annotationType: type,
          },
        },
      });
    } catch (error) {
      console.error('Failed to create annotation:', error);
    }
  };

  const getComplexityLevel = () => {
    switch (userType) {
      case 'beginner':
        return 'simple';
      case 'intermediate':
        return 'standard';
      case 'advanced':
        return 'detailed';
      case 'expert':
        return 'comprehensive';
      default:
        return 'standard';
    }
  };

  const renderLineItemValue = (value: number | null, unit: string) => {
    if (value === null) return '-';

    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

    return (
      <div className="flex items-center space-x-2">
        <span className="font-mono">{formattedValue}</span>
        <Badge variant="outline" className="text-xs">
          {unit}
        </Badge>
      </div>
    );
  };

  const renderLineItemTrend = (currentValue: number, previousValue: number) => {
    const change = currentValue - previousValue;
    const changePercent = (change / previousValue) * 100;
    const isPositive = change >= 0;

    return (
      <div className="flex items-center space-x-1 text-sm">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
          {changePercent.toFixed(1)}%
        </span>
      </div>
    );
  };

  const renderAnnotationIndicator = (lineItemId: string) => {
    const itemAnnotations = annotations.filter(a => a.lineItemId === lineItemId);
    if (itemAnnotations.length === 0) return null;

    return (
      <Badge variant="secondary" className="ml-2">
        <MessageSquare className="h-3 w-3 mr-1" />
        {itemAnnotations.length}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with statement info and collaborative features */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>{statement.formType} - {statement.periodEndDate}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Fiscal Year {statement.fiscalYear}
                {statement.fiscalQuarter && `, Q${statement.fiscalQuarter}`}
              </p>
            </div>

            {showCollaborativeFeatures && (
              <div className="flex items-center space-x-2">
                <CollaborativePresence statementId={statementId} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnnotations(!showAnnotations)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Annotations ({annotations.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="statement" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Statement</span>
          </TabsTrigger>
          <TabsTrigger value="ratios" className="flex items-center space-x-2">
            <Calculator className="h-4 w-4" />
            <span>Ratios</span>
            {ratios && (
              <Badge variant="secondary" className="ml-1">
                {Object.keys(ratios).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analysis</span>
          </TabsTrigger>
          {showEducationalContent && (
            <TabsTrigger value="education" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Learn</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Financial Statement Tab */}
        <TabsContent value="statement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Statement Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line Item</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statement.lineItems?.map((lineItem) => (
                    <TableRow
                      key={lineItem.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleLineItemClick(lineItem.id)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {selectedLineItem === lineItem.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{lineItem.standardLabel}</span>
                          {renderAnnotationIndicator(lineItem.id)}
                        </div>
                        {lineItem.taxonomyConcept && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {lineItem.taxonomyConcept}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {renderLineItemValue(lineItem.value, lineItem.unit)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lineItem.unit}</Badge>
                      </TableCell>
                      <TableCell>
                        {/* This would show trend data if available */}
                        <span className="text-muted-foreground">-</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {showCollaborativeFeatures && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddAnnotation(
                                  `Comment on ${lineItem.standardLabel}`,
                                  'comment',
                                  lineItem.id
                                );
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                          {showEducationalContent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEducational(true);
                                setActiveTab('education');
                              }}
                            >
                              <Lightbulb className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Ratios Tab */}
        <TabsContent value="ratios">
          <RatioAnalysisPanel
            ratios={ratios}
            loading={ratiosLoading}
            userType={userType}
            showEducationalContent={showEducationalContent}
          />
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Financial Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Key metrics cards would go here */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold">Profitability</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {ratios?.returnOnEquity ? `${(ratios.returnOnEquity * 100).toFixed(1)}%` : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Return on Equity</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold">Liquidity</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {ratios?.currentRatio ? ratios.currentRatio.toFixed(2) : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Current Ratio</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold">Valuation</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {ratios?.enterpriseValueToEbitda ? `${ratios.enterpriseValueToEbitda.toFixed(1)}x` : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">EV/EBITDA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Educational Tab */}
        {showEducationalContent && (
          <TabsContent value="education">
            <EducationalPanel
              statement={statement}
              ratios={ratios}
              userType={userType}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Annotation Panel (Sidebar) */}
      {showAnnotations && showCollaborativeFeatures && (
        <AnnotationPanel
          statementId={statementId}
          lineItemId={selectedLineItem}
          annotations={annotations}
          onAddAnnotation={handleAddAnnotation}
          onClose={() => setShowAnnotations(false)}
        />
      )}
    </div>
  );
};
