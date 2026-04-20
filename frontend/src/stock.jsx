export default function Stock({ inventory}) {

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-800">Inventario de Stock</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio 2</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {inventory.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-mono text-gray-600">{item.codigo}</td>
                                <td className="px-6 py-4 text-sm text-gray-800">{item.nombre}</td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`font-semibold ${item.cantidad === 0 ? 'text-red-600' :
                                        item.cantidad <= item.minStock ? 'text-yellow-600' :
                                            'text-green-600'
                                        }`}>
                                        {item.cantidad}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-800">${item.precio}</td>
                                <td className="px-6 py-4 text-sm text-gray-800">
                                    {item.precio_2 ? `$${item.precio_2.toFixed(2)}` : "-"} </td>
                                <td className="px-6 py-4 text-sm">
                                    {item.cantidad === 0 ? (
                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                            Sin Stock
                                        </span>
                                    ) : item.cantidad <= item.minStock ? (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                                            Stock Bajo
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                            Normal
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}