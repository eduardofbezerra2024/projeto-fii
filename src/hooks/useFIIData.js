import { useState, useEffect, useCallback } from 'react';
import { SAMPLE_FIIS } from '@/utils/constants';
import * as fiiService from '@/services/fiiService';

export const useFIIData = () => {
  const [fiis, setFiis] = useState(SAMPLE_FIIS);
  const [loading, setLoading] = useState(false);

  const getFIIByTicker = useCallback((ticker) => {
    return fiis.find(fii => fii.ticker === ticker.toUpperCase());
  }, [fiis]);

  const searchFIIs = useCallback((query) => {
    if (!query) return fiis;
    return fiis.filter(fii => 
      fii.ticker.toLowerCase().includes(query.toLowerCase()) ||
      fii.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [fiis]);

  const getFIIQuote = useCallback(async (ticker) => {
    setLoading(true);
    try {
      const quote = await fiiService.getFiiQuote(ticker);
      return quote;
    } catch (error) {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateTicker = useCallback(async (ticker) => {
    setLoading(true);
    try {
      const result = await fiiService.searchFii(ticker);
      return result.exists;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);


  return {
    fiis,
    loading,
    getFIIByTicker,
    searchFIIs,
    getFIIQuote,
    validateTicker,
  };
};