import React, { useContext, useState } from 'react';
import { WorkspaceContext } from '../workspaces/WorkspaceContext';

const TemplateUploader = () => {
  const { activeWorkspaceId } = useContext(WorkspaceContext);
  const [file, setFile] = useState(null);
  const [uploadedTemplates, setUploadedTemplates] = useState([]);

  const handleUpload = () => {
    if (!file || !activeWorkspaceId) return;

    const formData = new FormData();
    formData.append('file', file);

    fetch(`http://localhost:8000/api/v1/workspaces/${activeWorkspaceId}/templates`, {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        setUploadedTemplates([...uploadedTemplates, data]);
        setFile(null);
      })
      .catch(err => console.error(err));
  };

  if (!activeWorkspaceId) return <p>Select a workspace to upload templates.</p>;

  return (
    <div>
      <div style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', marginBottom: '10px' }}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pptx,.docx,.pdf,.md" />
        <button onClick={handleUpload} disabled={!file}>Upload Template</button>
      </div>
      <div>
        <h4>Uploaded Templates</h4>
        {uploadedTemplates.map(t => (
          <div key={t.template_id} style={{ display: 'inline-block', padding: '5px', margin: '5px', background: '#eee', borderRadius: '4px' }}>
            {t.file_name} <button onClick={() => setUploadedTemplates(uploadedTemplates.filter(x => x.template_id !== t.template_id))}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateUploader;
