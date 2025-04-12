'use client';

import { useState, useEffect } from 'react';

export default function Client() {
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDepartamentos = async () => {
    try {
      const response = await fetch('/api/getDepartamentos');
      if (!response.ok) {
        throw new Error('Error fetching data');
      }
      const data = await response.json();
      setDepartamentos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  const handleDelete = async (codigoDepartamento) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este departamento?')) {
      return;
    }
  
    setDeletingId(codigoDepartamento);
  
    try {
      const response = await fetch('/api/deleteDepartamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigoDepartamento }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el departamento');
      }
  
      setDepartamentos(departamentos.filter(departamento => departamento.id_Departamento !== codigoDepartamento));
      alert('Departamento eliminado con éxito');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lista de Departamentos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departamentos.map((departamento) => (
          <div key={departamento.id_Departamento} className="bg-white p-4 rounded-lg shadow text-black">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">Departamento: {departamento.id_Departamento}</h2>
              <button
                onClick={() => handleDelete(departamento.id_Departamento)}
                disabled={deletingId === departamento.id_Departamento}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {deletingId === departamento.id_Departamento ? 'Eliminando...' : 'Eliminar Departamento'}
              </button>
            </div>
            <p><span className="font-bold">Nombre:</span> {departamento.Nombre}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
