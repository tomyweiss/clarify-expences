import { useState, useEffect } from 'react';

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/get_all_categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          throw new Error('Failed to fetch categories');
        }
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  return { categories, loading, error };
};

