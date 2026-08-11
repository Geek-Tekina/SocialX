const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "socialx.events";

async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    logger.info("Connected to rabbit mq");
    return channel;
  } catch (error) {
    logger.error("Error connecting to rabbit mq", error);
    throw error;
  }
}

async function consumeEvents(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  const queueName = `notification-service.${routingKey.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const queue = await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(queue.queue, EXCHANGE_NAME, routingKey);

  channel.consume(queue.queue, async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());
      await callback(content);
      channel.ack(msg);
    } catch (error) {
      logger.error(`Error handling ${routingKey}`, error);
      channel.nack(msg, false, false);
    }
  });

  logger.info(`Subscribed to event: ${routingKey}`);
}

module.exports = { connectToRabbitMQ, consumeEvents };
