import { useCallback, useEffect, useState } from 'react';
import { listAssets } from '../api/assets';
import { normalizeAssetList } from '../utils/normalizeAsset';
import { getApiErrorMessage } from '../api/axiosInstance';

export function useAssets({ category, search, sort } = {}) {
  const [assets, setAssets] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAssets = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const data = await listAssets({ category, search, sort });
      setAssets(normalizeAssetList(data));
      setStatus('success');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Gagal memuat aset.'));
      setStatus('error');
    }
  }, [category, search, sort]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return { assets, status, errorMessage, refetch: fetchAssets };
}
