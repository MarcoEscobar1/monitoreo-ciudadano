const bcrypt = require('bcryptjs');

const password = 'admin123';
const hashFromDB = '$2a$12$yV46UDqp3Tzyd6jLeNbYV.onangi8Ywq81WBTd3bl2xWh.IwP510O';

console.log('🔐 Probando password:', password);
console.log('🔑 Hash en DB:', hashFromDB);

bcrypt.compare(password, hashFromDB).then(result => {
  console.log('✅ Resultado:', result);
  if (result) {
    console.log('✅ ¡Password correcto!');
  } else {
    console.log('❌ Password incorrecto');
  }
}).catch(err => {
  console.error('❌ Error:', err);
});
