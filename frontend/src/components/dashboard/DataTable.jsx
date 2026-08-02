// Minimal, borderless data table in a white card — used for the Dashboard's
// detail sections (top products, seller performance).
//
// columns: [{ key, label, align?: 'left'|'right'|'center', className?, render?(row) }]

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' };

export default function DataTable({ title, columns, rows = [], empty = 'Sin datos en este período' }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-xl font-bold text-gray-700">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wide">
              {columns.map((c) => (
                <th key={c.key} className={`px-5 py-2 font-medium ${ALIGN[c.align] || 'text-left'}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-gray-400">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/70 transition">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-5 py-3 ${ALIGN[c.align] || 'text-left'} ${
                        typeof c.className === 'function' ? c.className(row) : c.className || 'text-gray-700'
                      }`}
                    >
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
