import React, { useContext, useState } from 'react';
import { WorkspaceContext } from './WorkspaceContext';
import WorkspaceModal from './WorkspaceModal';

const WorkspaceTabs = () => {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId } = useContext(WorkspaceContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        {workspaces.map(ws => (
          <button
            key={ws.id}
            onClick={() => setActiveWorkspaceId(ws.id)}
            style={{
              padding: '10px',
              fontWeight: ws.id === activeWorkspaceId ? 'bold' : 'normal',
              background: ws.id === activeWorkspaceId ? '#e0e0e0' : 'transparent',
            }}
          >
            {ws.title} ({ws.target_format})
          </button>
        ))}
        <button onClick={() => setIsModalOpen(true)} style={{ padding: '10px' }}>
          + New Topic
        </button>
      </div>
      {isModalOpen && <WorkspaceModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default WorkspaceTabs;
