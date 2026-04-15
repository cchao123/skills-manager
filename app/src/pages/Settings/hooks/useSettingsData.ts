import { useState, useEffect } from 'react';
import { agentsApi } from '@/api/tauri';
import type { AgentConfig } from '@/types';

export const useSettingsData = () => {
  const [agents, setAgents] = useState<AgentConfig[]>([]);

  const loadAgents = async () => {
    try {
      const updatedAgents = await agentsApi.detect();
      setAgents(updatedAgents);
    } catch (error) {
      console.error('Failed to detect agents:', error);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  return {
    agents,
    loadAgents,
  };
};
