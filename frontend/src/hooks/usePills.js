import { useCallback, useEffect, useState } from 'react';
import { getPills } from '../services/pills.service';
import toast from 'react-hot-toast';

export function usePills() {
  const [pills, setPills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPills = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPills();
      setPills(data);
    } catch {
      toast.error('Failed to load pills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPills();
  }, [fetchPills]);

  return { pills, loading, refetch: fetchPills };
}
