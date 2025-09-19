const express = require('express');
const amqp = require('amqplib');

async function connectRabbitMQ(retries = 10, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect('amqp://rabbitmq');
      console.log('✅ Conectado a RabbitMQ');
      return conn;
    } catch (err) {
      console.error(`❌ Falló intento ${i + 1}/${retries}: ${err.message}`);
      if (i < retries - 1) {
        console.log(`Reintentando en ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw new Error('No se pudo conectar a RabbitMQ después de varios intentos');
      }
    }
  }
}

async function start() {
  const conn = await connectRabbitMQ();
  const channel = await conn.createChannel();
  await channel.assertExchange('fhir-exchange', 'topic', { durable: true });
  await channel.assertQueue('fhir.queue', { durable: true });
  await channel.bindQueue('fhir.queue', 'fhir-exchange', 'patient.#');

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/callback', (req, res) => {
    const body = JSON.stringify(req.body || {});
    console.log('📩 Callback recibido. Publicando a RabbitMQ...');
    channel.publish('fhir-exchange', 'patient.events', Buffer.from(body));
    res.status(200).send('ok');
  });

app.put(['/callback', '/callback/*'], (req, res) => {
  const body = JSON.stringify(req.body || {});
  console.log('📩 Callback recibido (PUT). Publicando a RabbitMQ...');
  channel.publish('fhir-exchange', 'patient.events', Buffer.from(body));
  res.status(200).send('ok');
});



  app.listen(3000, () => console.log('🚀 Callback service en puerto 3000'));
}

start().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
