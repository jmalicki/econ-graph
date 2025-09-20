import React from 'react';

interface BenchmarkData {
  percentile: number;
  industryMedian: number;
  industryP25: number;
  industryP75: number;
  industryP90: number;
  industryP10: number;
}

interface BenchmarkComparisonProps {
  ratioName: string;
  companyValue: number;
  benchmarkData?: BenchmarkData;
}

export const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({
  ratioName,
  companyValue,
  benchmarkData,
}) => {
  if (!benchmarkData) {
    return (
      <div className='benchmark-comparison p-4 bg-gray-50 rounded-lg'>
        <h4 className='text-sm font-medium text-gray-700 mb-2'>Industry Benchmark: {ratioName}</h4>
        <p className='text-sm text-gray-600'>No benchmark data available for this ratio.</p>
      </div>
    );
  }

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return 'text-green-600';
    if (percentile >= 50) return 'text-blue-600';
    if (percentile >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentileLabel = (percentile: number) => {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Median';
    if (percentile >= 25) return 'Below Median';
    return 'Bottom 25%';
  };

  return (
    <div className='benchmark-comparison p-4 bg-gray-50 rounded-lg'>
      <h4 className='text-sm font-medium text-gray-700 mb-3'>Industry Benchmark: {ratioName}</h4>

      <div className='space-y-3'>
        <div className='flex justify-between items-center'>
          <span className='text-sm text-gray-600'>Company Value:</span>
          <span className='font-medium'>{companyValue.toFixed(2)}</span>
        </div>

        <div className='flex justify-between items-center'>
          <span className='text-sm text-gray-600'>Industry Percentile:</span>
          <span className={`font-medium ${getPercentileColor(benchmarkData.percentile)}`}>
            {benchmarkData.percentile.toFixed(1)}% ({getPercentileLabel(benchmarkData.percentile)})
          </span>
        </div>

        <div className='border-t pt-3'>
          <h5 className='text-xs font-medium text-gray-600 mb-2'>Industry Distribution</h5>
          <div className='grid grid-cols-2 gap-2 text-xs'>
            <div className='flex justify-between'>
              <span className='text-gray-500'>P10:</span>
              <span>{benchmarkData.industryP10.toFixed(2)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-500'>P25:</span>
              <span>{benchmarkData.industryP25.toFixed(2)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-500'>Median:</span>
              <span className='font-medium'>{benchmarkData.industryMedian.toFixed(2)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-500'>P75:</span>
              <span>{benchmarkData.industryP75.toFixed(2)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-500'>P90:</span>
              <span>{benchmarkData.industryP90.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
