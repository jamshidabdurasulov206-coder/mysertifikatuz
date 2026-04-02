require("dotenv").config();
const app = require("./app");

const logger = require("./utils/logger");
const { startAttemptWorker } = require("./queue/attemptQueue");

const PORT = process.env.PORT || 4000;

const enableQueue = process.env.ENABLE_REDIS_QUEUE === "true";
const disableWorker = process.env.DISABLE_ATTEMPT_WORKER === "true";

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server ${PORT}-portda muvaffaqiyatli ishga tushdi`);
  if (enableQueue) {
    logger.info("[AttemptQueue] ENABLE_REDIS_QUEUE=true, DISABLE_ATTEMPT_WORKER=%s", disableWorker);
    startAttemptWorker();
  } else {
    logger.info("[AttemptQueue] Redis queue o'chirilgan (ENABLE_REDIS_QUEUE !== true)");
  }
});

// Server kutilmaganda o'chib qolmasligi uchun
process.on('unhandledRejection', (err) => {
  logger.error("Unhandled Rejection! O'chirilmoqda...", { name: err.name, message: err.message, stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});