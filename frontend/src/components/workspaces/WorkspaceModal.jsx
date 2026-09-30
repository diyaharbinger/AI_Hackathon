import React, { useState, useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';

const WorkspaceModal = ({ onClose }) => {
  const { addWorkspace } = useContext(WorkspaceContext);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_format: 'DOCX',
    user_instructions: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addWorkspace(formData);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
        <h3>Create New Topic Workspace</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="text" placeholder="Title" required 
            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
          />
          <textarea 
            placeholder="Description" required 
            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
          />
          <select value={formData.target_format} onChange={e => setFormData({...formData, target_format: e.target.value})}>
            <option value="PPT">PPT</option>
            <option value="DOCX">DOCX</option>
            <option value="MD">MD</option>
            <option value="PDF">PDF</option>
          </select>
          <textarea 
            placeholder="User Instructions (Optional)" 
            value={formData.user_instructions} onChange={e => setFormData({...formData, user_instructions: e.target.value})} 
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceModal;
