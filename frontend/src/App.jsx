import React from 'react';
import { WorkspaceProvider } from './components/workspaces/WorkspaceContext';
import WorkspaceTabs from './components/workspaces/WorkspaceTabs';
import AgentStepper from './components/pipeline/AgentStepper';
import TemplateUploader from './components/upload/TemplateUploader';

function App() {
  return (
    <WorkspaceProvider>
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Agentic Flow</h1>
        <WorkspaceTabs />
        <hr />
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <h2>Pipeline</h2>
            <AgentStepper />
          </div>
          <div style={{ flex: 1 }}>
            <h2>Templates</h2>
            <TemplateUploader />
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
}

export default App;
