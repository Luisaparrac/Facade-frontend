import { useEffect } from 'react';
import { clinicApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from './useAsync';

/** Loads the consolidated history (ClinicFacade.getFullHistory) for the signed-in patient. */
export function usePatientHistory() {
  const { patient, logout } = useAuth();
  const toast = useToast();
  const result = useAsync(() => clinicApi.getFullHistory(patient.id), [patient.id]);

  useEffect(() => {
    // The patient no longer exists (in-memory data was reset) or belongs to another session.
    if (result.error?.status === 404 || result.error?.status === 403) {
      toast.error('Tu sesión ya no es válida. Inicia sesión nuevamente.');
      logout();
    }
  }, [result.error, toast, logout]);

  return result;
}
