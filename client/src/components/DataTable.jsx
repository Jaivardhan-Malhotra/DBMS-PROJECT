import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records match your criteria.',
}) => {
  if (loading) {
    return (
      <div className="table-container" style={{ padding: '2rem 0' }}>
        <LoadingSpinner message="Fetching data..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                style={col.align ? { textAlign: col.align } : {}}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || row._id || row.team_id || row.player_id || row.match_id || rowIndex}>
              {columns.map((col, colIndex) => {
                const cellValue = col.key ? row[col.key] : null;
                return (
                  <td
                    key={`${rowIndex}-${col.key || colIndex}`}
                    style={col.align ? { textAlign: col.align } : {}}
                    className={col.className || ''}
                  >
                    {col.render ? col.render(cellValue, row, rowIndex) : cellValue ?? '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
