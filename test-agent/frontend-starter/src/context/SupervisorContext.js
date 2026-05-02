import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { getConversations, getAgents } from '../api';

const SupervisorContext = createContext(null);

export const useSupervisor = () => useContext(SupervisorContext);

export const SupervisorProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('supervisor_templates');
    return saved ? JSON.parse(saved) : [];
  });
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState({ conversations: true, agents: true });
  const [error, setError] = useState({ conversations: null, agents: null });
  
  const wsRef = useRef(null);
  
  // Use relative protocol (wss/ws) based on current page and current host so CRA proxy forwards it
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const WS_URL = process.env.REACT_APP_WS_URL || `${protocol}//${window.location.host}`;

  useEffect(() => {
    localStorage.setItem('supervisor_templates', JSON.stringify(templates));
  }, [templates]);

  const connectWebSocket = () => {
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('Supervisor WebSocket connected');
      setIsConnected(true);
      wsRef.current = ws;
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'new_conversation':
            setConversations(prev => [...prev, message.data]);
            break;
          case 'metrics_update':
            setConversations(prev => 
              prev.map(conv => 
                conv.id === message.conversationId 
                  ? { ...conv, metrics: { ...conv.metrics, ...message.metrics } } 
                  : conv
              )
            );
            break;
          case 'message_update':
            setConversations(prev => 
              prev.map(conv => {
                if (conv.id === message.conversationId) {
                  return {
                    ...conv,
                    messages: [...(conv.messages || []), message.message],
                    hasNewMessage: true
                  };
                }
                return conv;
              })
            );
            break;
          default:
            break;
        }
      } catch (e) {
        console.error("Error parsing WS message:", e);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(connectWebSocket, 3000);
    };
  };

  const loadData = async () => {
    setLoading({ conversations: true, agents: true });
    setError({ conversations: null, agents: null });
    
    try {
      const convRes = await getConversations();
      setConversations(convRes.data || []);
      setLoading(prev => ({ ...prev, conversations: false }));
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(prev => ({ ...prev, conversations: err.message }));
      setLoading(prev => ({ ...prev, conversations: false }));
    }
    
    try {
      const agRes = await getAgents();
      setAgents(agRes || []);
      setLoading(prev => ({ ...prev, agents: false }));
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(prev => ({ ...prev, agents: err.message }));
      setLoading(prev => ({ ...prev, agents: false }));
    }
  };

  useEffect(() => {
    loadData();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const addTemplate = (template) => {
    setTemplates(prev => [...prev, { id: Date.now().toString(), ...template }]);
  };

  const deleteTemplate = (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <SupervisorContext.Provider value={{
      conversations,
      setConversations,
      agents,
      setAgents,
      templates,
      addTemplate,
      deleteTemplate,
      isConnected,
      loading,
      error,
      refetch: loadData,
      ws: wsRef.current
    }}>
      {children}
    </SupervisorContext.Provider>
  );
};
