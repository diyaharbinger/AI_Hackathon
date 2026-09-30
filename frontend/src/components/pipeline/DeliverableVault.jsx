import React from 'react';

const DeliverableVault = ({ topicId }) => {
  return (
    <div style={{ marginTop: '20px', padding: '15px', border: '2px solid #28a745', borderRadius: '8px' }}>
      <h3>Deliverable Vault</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0f8ff', padding: '10px' }}>
        <span>Final_Document_{topicId.substring(0,6)}.docx</span>
        <a 
          href={`http://localhost:8000/api/v1/workspaces/${topicId}/export`} 
          download
          style={{ padding: '8px', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px' }}
        >
          Download Deliverable
        </a>
      </div>
    </div>
  );
};

export default DeliverableVault;
