import React from 'react';

const ReviewPanel = ({ event, onApprove }) => {
  if (!event || !event.payload) return null;

  return (
    <div style={{ marginTop: '20px', padding: '15px', border: '2px solid #00A3E0', borderRadius: '8px' }}>
      <h3>Human-in-the-Loop Review</h3>
      <div style={{ background: '#f9f9f9', padding: '10px', height: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
        {event.payload.refined_content_preview}
      </div>
      <div style={{ marginTop: '10px', display: 'flex', gap: '20px' }}>
        <div><strong>Reading Grade Level:</strong> {event.payload.reading_grade_level}</div>
        <div><strong>Redundancies Removed:</strong> {event.payload.redundancies_removed}</div>
        <div><strong>Verified Citations:</strong> {event.payload.verified_citations_count}</div>
      </div>
      <div style={{ marginTop: '15px' }}>
        <button onClick={onApprove} style={{ background: '#00A3E0', color: 'white', padding: '10px' }}>
          Approve & Compile
        </button>
      </div>
    </div>
  );
};

export default ReviewPanel;
