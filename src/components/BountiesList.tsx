import React, { useState, useEffect } from 'react';
import { fetchBounties, Bounty } from '../api';
import { usePassword } from '../hooks';
import { toast } from 'react-toastify';

const BountiesList: React.FC = () => {
  const { password: apiKey } = usePassword('torn-api-key');
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const limit = 100;

  useEffect(() => {
    const loadBounties = async () => {
      if (!apiKey) {
        return;
      }

      setLoading(true);

      const result = await fetchBounties({ apiKey, limit, offset });

      if (result.error) {
        toast.error(`Failed to load bounties: ${result.error}`);
        setBounties([]);
      } else if (result.data) {
        setBounties(result.data.bounties);
        setHasNext(result.data._metadata.links.next !== null);
        setHasPrev(result.data._metadata.links.prev !== null);
      }

      setLoading(false);
    };

    loadBounties();
  }, [apiKey, offset]);

  const handlePrevious = () => {
    if (offset >= limit) {
      setOffset(offset - limit);
    }
  };

  const handleNext = () => {
    setOffset(offset + limit);
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!apiKey) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Torn Bounties</h2>
        <p>Please set your Torn API key in the Settings page to view bounties.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Torn Bounties</h2>
      
      {loading && <p>Loading bounties...</p>}
      
      {!loading && bounties.length === 0 && (
        <p>No bounties found.</p>
      )}
      
      {!loading && bounties.length > 0 && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <strong>{bounties.length}</strong> bounties loaded (showing {offset + 1} - {offset + bounties.length})
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Target</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Level</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Lister</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Reward</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Reason</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>Quantity</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Valid Until</th>
              </tr>
            </thead>
            <tbody>
              {bounties.map((bounty, index) => (
                <tr 
                  key={`${bounty.target_id}-${index}`}
                  style={{ borderBottom: '1px solid #eee' }}
                >
                  <td style={{ padding: '8px' }}>
                    {bounty.target_name} ({bounty.target_id})
                  </td>
                  <td style={{ padding: '8px' }}>{bounty.target_level}</td>
                  <td style={{ padding: '8px' }}>
                    {bounty.is_anonymous ? 'Anonymous' : `${bounty.lister_name} (${bounty.lister_id})`}
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>
                    {formatCurrency(bounty.reward)}
                  </td>
                  <td style={{ padding: '8px' }}>{bounty.reason}</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{bounty.quantity}</td>
                  <td style={{ padding: '8px', fontSize: '0.9em' }}>
                    {formatDate(bounty.valid_until)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrevious}
              disabled={!hasPrev || offset === 0 || loading}
              style={{
                padding: '8px 16px',
                cursor: (!hasPrev || offset === 0 || loading) ? 'not-allowed' : 'pointer',
                opacity: (!hasPrev || offset === 0 || loading) ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNext || loading}
              style={{
                padding: '8px 16px',
                cursor: (!hasNext || loading) ? 'not-allowed' : 'pointer',
                opacity: (!hasNext || loading) ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BountiesList;
