import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // adjust path if needed

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: tableData, error } = await supabase.from('your_table').select('*');
      if (error) console.error(error);
      else setData(tableData);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      {data.map((item) => (
        <p key={item.id}>{item.name}</p> // change fields to match your table
      ))}
    </div>
  );
}
