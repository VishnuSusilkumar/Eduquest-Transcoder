import "dotenv/config";

export default {
  rabbitMQ: {
    url: String(process.env.RabbitMQ_Link),
    queues: {
      authQueue: "auth_queue",
    },
  },
};
