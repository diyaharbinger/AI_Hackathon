import React, { createContext, useState, useEffect } from 'react';

export const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/workspaces')
      .then(res => res.json())
      .then(data => {
        setWorkspaces(data);
        if (data.length > 0) setActiveWorkspaceId(data[0].id);
      })
      .catch(err => console.error(err));
  }, []);

  const addWorkspace = (workspaceData) => {
    fetch('http://localhost:8000/api/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workspaceData),
    })
      .then(res => res.json())
      .then(data => {
        const newWs = { id: data.workspace_id, ...workspaceData, status: data.status };
        setWorkspaces([...workspaces, newWs]);
        setActiveWorkspaceId(newWs.id);
      })
      .catch(err => console.error(err));
  };

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspaceId, setActiveWorkspaceId, addWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
