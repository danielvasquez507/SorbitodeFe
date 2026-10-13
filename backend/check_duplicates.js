const db = require('./db.js');

const query = `
  SELECT id, email_id, fecha, comercio, monto 
  FROM transacciones 
  WHERE (fecha, comercio, monto) IN (
    SELECT fecha, comercio, monto 
    FROM transacciones 
    GROUP BY fecha, comercio, monto 
    HAVING COUNT(*) > 1
  )
  ORDER BY fecha DESC, comercio, monto
`;
const exactDups = db.prepare(query).all();
console.log(exactDups.slice(0, 10));
