const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "socialx.events";
const QUEUE_NAME = "media-service.post-deleted";

async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL, { family: 4 });
    channel = await connection.createChannel();

    connection.on("error", (error) => {
      logger.error("RabbitMQ connection error", error);
    });

    connection.on("close", () => {
      logger.warn("RabbitMQ connection closed");
      connection = null;
      channel = null;
    });

    channel.on("error", (error) => {
      logger.error("RabbitMQ channel error", error);
    });

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    await channel.prefetch(1);
    logger.info("Connected to rabbit mq");
    return channel;
  } catch (e) {
    logger.error("Error connecting to rabbit mq", e);
    throw e;
  }
}

async function publishEvent(routingKey, message) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  const published = channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message)),
    {
      contentType: "application/json",
      persistent: true,
    }
  );

  if (!published) {
    logger.warn(`RabbitMQ write buffer is full while publishing: ${routingKey}`);
  }

  logger.info(`Event published: ${routingKey}`);
}

async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  const q = await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, routingKey);

  channel.consume(q.queue, async (msg) => {
    if (!msg) {
      return;
    }

    try {
      const content = JSON.parse(msg.content.toString());
      await callback(content);
      channel.ack(msg);
    } catch (error) {
      logger.error(`Error processing RabbitMQ event: ${routingKey}`, error);
      const shouldRequeue = !(error instanceof SyntaxError);
      channel.nack(msg, false, shouldRequeue);
    }
  });

  logger.info(`Subscribed to event: ${routingKey}`);
}

module.exports = { connectToRabbitMQ, publishEvent, consumeEvent };
