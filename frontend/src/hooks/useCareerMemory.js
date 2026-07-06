import { useContext } from 'react';
import { CareerMemoryContext } from '../context/CareerMemoryContext';

export function useCareerMemory() {
  const context = useContext(CareerMemoryContext);
  
  if (context === undefined) {
    throw new Error('useCareerMemory must be used within a CareerMemoryProvider');
  }
  
  return context;
}
