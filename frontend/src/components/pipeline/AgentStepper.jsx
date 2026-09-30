import React, { useContext, useEffect, useState, useRef } from 'react';
import { WorkspaceContext } from '../workspaces/WorkspaceContext';
import ReviewPanel from './ReviewPanel';
import DeliverableVault from './DeliverableVault';

const AgentStepper = () => {
  const { activeWorkspaceId } = useContext(WorkspaceContext);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('IDLE');
  const wsRef = useRef(null);
  
  const agents = [
    "Requirement Analysis Agent",
    "Planning Agent",
    "Reference Analysis Agent",
    "Research & Enrichment Agent",
    "Content Generation Agent",
    "Content Review Agent",
    "Format Generation Agent"
  ];

  useEffect(() => {
    if (!activeWorkspaceId) return;
    // Reset state for new tab
    setEvents([]);
    
    fetch(`http://localhost:8000/api/v1/workspaces/${activeWorkspaceId}/status`)
      .then(res => res.json())
      .then(data => setStatus(data.status))
      .catch(err => console.error(err));

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeWorkspaceId]);

  const handleStart = () => {
    fetch(`http://localhost:8000/api/v1/workspaces/${activeWorkspaceId}/generate`, { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        setStatus('PROCESSING');
        const ws = new WebSocket(`ws://localhost:8000/api/v1/workspaces/${activeWorkspaceId}/stream`);
        wsRef.current = ws;
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setEvents(prev => [...prev, data]);
          if (data.status === 'WAITING_FOR_REVIEW') setStatus('WAITING_FOR_REVIEW');
          if (data.status === 'COMPLETED' && data.agent_name === 'Format Generation Agent') setStatus('COMPLETED');
        };
      });
  };

  if (!activeWorkspaceId) return <p>Select a workspace</p>;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleStart} disabled={status !== 'IDLE' && status !== 'CREATED'}>Start Autonomous Generation</button>
        <span style={{ marginLeft: '10px' }}>Status: {status}</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {agents.map((agent, idx) => {
          const agentEvent = events.find(e => e.agent_name === agent);
          return (
            <div key={idx} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <strong>{idx + 1}. {agent}</strong>
              {agentEvent && (
                <div style={{ marginTop: '5px', color: '#555' }}>
                  <p>{agentEvent.message}</p>
                  <progress value={agentEvent.progress_percent} max="100" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {status === 'WAITING_FOR_REVIEW' && (
        <ReviewPanel 
          event={events.find(e => e.status === 'WAITING_FOR_REVIEW')} 
          onApprove={() => setStatus('COMPLETED')} // Mock approval advancing to completion
        />
      )}
      
      {status === 'COMPLETED' && <DeliverableVault topicId={activeWorkspaceId} />}
    </div>
  );
};

export default AgentStepper;
