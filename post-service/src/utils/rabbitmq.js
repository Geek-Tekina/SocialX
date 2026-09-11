const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "socialx.events";

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

module.exports = { connectToRabbitMQ, publishEvent };
