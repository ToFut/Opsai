import { useState, useCallback } from 'react';
import { FieldValues } from 'react-hook-form';

export interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  data: FieldValues | null;
}

export interface UseFormStateOptions {
  onSuccess?: (data: FieldValues) => void;
  onError?: (error: Error) => void;
  resetOnSuccess?: boolean;
  resetDelay?: number;
}

export function useFormState(options: UseFormStateOptions = {}) {
  const {
    onSuccess,
    onError,
    resetOnSuccess = true,
    resetDelay = 2000
  } = options;

  const [state, setState] = useState<FormState>({
    isSubmitting: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: null
  });

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null
    });
  }, []);

  const handleSubmit = useCallback(async (
    submitFn: (data: FieldValues) => Promise<any>,
    data: FieldValues
  ) => {
    setState(prev => ({ ...prev, isSubmitting: true, isError: false, error: null }));

    try {
      const result = await submitFn(data);
      
      setState({
        isSubmitting: false,
        isSuccess: true,
        isError: false,
        error: null,
        data: result || data
      });

      onSuccess?.(result || data);

      if (resetOnSuccess) {
        setTimeout(reset, resetDelay);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setState({
        isSubmitting: false,
        isSuccess: false,
        isError: true,
        error: errorMessage,
        data: null
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [onSuccess, onError, resetOnSuccess, resetDelay, reset]);

  return {
    ...state,
    reset,
    handleSubmit
  };
}