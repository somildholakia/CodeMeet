import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data } = await api.get('/meetings');
      return data.meetings;
    },
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title) => {
      const { data } = await api.post('/meetings', { title });
      return data.meeting;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/meetings/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
}
