import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MacroDashboard = () => {
  const [data, setData] = useState({
    inflation: null,
    tbill: null,
    longTermRates: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estimatedInflation, setEstimatedInflation] = useState(2.5);
  const [estimatedGrowth, setEstimatedGrowth] = useState(1.5);

  useEffect(() => {
    // Validate backend URL is configured
    if (!BACKEND_URL) {
        setError('Backend URL not configured');
        setLoading(false);
        return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [inflationRes, tbillRes, longTermRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/v1/inflation`),
          axios.get(`${BACKEND_URL}/api/v1/tbill`),
          axios.get(`${BACKEND_URL}/api/v1/long_term_rates`)
        ]);

        setData({
          inflation: inflationRes.data,
          tbill: tbillRes.data,
          longTermRates: longTermRes.data
        });
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load market data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(fetchData, 300000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Loading Market Data...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const effectiveRealYield = data.tbill !== null ? (data.tbill - estimatedInflation).toFixed(2) : null;
  const marketInflation = data.longTermRates ? (data.longTermRates.bond_yield - data.longTermRates.tips_yield).toFixed(2) : null;
  const deltaInflation = data.longTermRates ? (marketInflation - estimatedInflation).toFixed(2) : null;
  const deltaGrowth = data.longTermRates ? (data.longTermRates.tips_yield - estimatedGrowth).toFixed(2) : null;
  const estimatedReturns = data.longTermRates ? 
    (data.longTermRates.bond_yield + parseFloat(deltaInflation) + parseFloat(deltaGrowth)).toFixed(2) : null;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6">Macroeconomic Dashboard</h1>
      
      <div className="grid gap-6">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current Market Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded shadow-sm">
                <p className="text-gray-600">Current Inflation Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.inflation !== null ? `${data.inflation.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-white rounded shadow-sm">
                <p className="text-gray-600">Current (Nominal) 4wk T-Bill Yield</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.tbill !== null ? `${data.tbill.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Parameters</h2>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded shadow-sm">
                <label className="block text-gray-600">
                  Estimated Inflation
                  <input
                    type="number"
                    step="0.1"
                    value={estimatedInflation}
                    onChange={(e) => setEstimatedInflation(parseFloat(e.target.value))}
                    className="ml-4 p-1 border rounded"
                  />
                  %
                </label>
              </div>
              <div className="p-4 bg-white rounded shadow-sm">
                <p className="text-gray-600">Effective Real T-Bill Yield</p>
                <p className="text-2xl font-bold text-blue-600">
                  {effectiveRealYield !== null ? `${effectiveRealYield}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Long-term Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded shadow-sm">
                <p className="text-gray-600">20-year Bond Yield</p>
                <p className="text-xl font-bold text-blue-600">
                  {data.longTermRates?.bond_yield ? `${data.longTermRates.bond_yield.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-white rounded shadow-sm">
                <p className="text-gray-600">Horizon Premium (20yr TIPS yield)</p>
                <p className="text-xl font-bold text-blue-600">
                  {data.longTermRates?.tips_yield ? `${data.longTermRates.tips_yield.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-white rounded shadow-sm col-span-2">
                <p className="text-gray-600">Market Implied Inflation (=20-year Bond Yield - 20-year TIPS Yield)</p>
                <p className="text-xl font-bold text-blue-600">
                  {marketInflation !== null ? `${marketInflation}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Long-term Parameters</h2>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded shadow-sm">
                <label className="block text-gray-600">
                  20yr Real GDP Growth Estimate
                  <input
                    type="number"
                    step="0.1"
                    value={estimatedGrowth}
                    onChange={(e) => setEstimatedGrowth(parseFloat(e.target.value))}
                    className="ml-4 p-1 border rounded"
                  />
                  %
                </label>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded shadow-sm">
                <p className="text-gray-600">Δ Inflation</p>
                <p className="text-xl font-bold text-blue-600">
                  {deltaInflation !== null ? `${deltaInflation}%` : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-white rounded shadow-sm">
                <p className="text-gray-600">Δ Growth</p>
                <p className="text-xl font-bold text-blue-600">
                  {deltaGrowth !== null ? `${deltaGrowth}%` : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-white rounded shadow-sm">
                <p className="text-gray-600">Estimated Returns</p>
                <p className="text-xl font-bold text-blue-600">
                  {estimatedReturns !== null ? `${estimatedReturns}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacroDashboard;