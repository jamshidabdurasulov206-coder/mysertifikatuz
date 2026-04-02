const bullmq = require("bullmq");
const { Queue, Worker } = bullmq;
const QueueScheduler = bullmq.QueueScheduler;
const logger = require("../utils/logger");
const { evaluateAttemptByAI } = require("../services/attemptEvaluation.service");

const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : { host: process.env.REDIS_HOST || "127.0.0.1", port: Number(process.env.REDIS_PORT) || 6379 };

const queueName = "attempt-evaluation";

let attemptQueue;
let scheduler;
let redisDisabled = false;

function getQueue() {
  if (redisDisabled) return null;
  if (!attemptQueue) {
    try {
      attemptQueue = new Queue(queueName, { connection });
      if (typeof QueueScheduler === "function") {
        scheduler = new QueueScheduler(queueName, { connection });
        logger.info("[AttemptQueue] Queue va scheduler yaratildi", connection);
      } else {
        scheduler = null;
        logger.warn("[AttemptQueue] QueueScheduler mavjud emas, worker-only rejim ishlatiladi");
      }
    } catch (err) {
      const schedulerCtorError = /QueueScheduler is not a constructor/i.test(err?.message || "");
      if (schedulerCtorError) {
        scheduler = null;
        logger.warn("[AttemptQueue] QueueScheduler versiyasi mos emas, worker-only rejim ishlatiladi");
      } else {
        redisDisabled = true;
        attemptQueue = null;
        scheduler = null;
        logger.warn("[AttemptQueue] Redisga ulana olmadi, queue o'chirildi", { message: err.message });
        return null;
      }
    }
  }
  return attemptQueue;
}

async function enqueueAttemptEvaluation(attemptId) {
  const queue = getQueue();
  if (!queue) {
    // Fallback: sinxron baholash
    try {
      await evaluateAttemptByAI(attemptId);
      logger.warn("[AttemptQueue] Redis yo'q, sinxron baholash bajarildi", { attemptId });
      return;
    } catch (inner) {
      logger.error("[AttemptQueue] Fallback baholash xatosi", { message: inner.message });
      throw inner;
    }
  }

  try {
    await queue.add(
      "evaluate",
      { attemptId },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: 20
      }
    );
  } catch (err) {
    logger.error("[AttemptQueue] Job qo'shishda xatolik", { message: err.message });
    // Fallback: sinxron baholash
    try {
      await evaluateAttemptByAI(attemptId);
      logger.warn("[AttemptQueue] Redis yo'q, sinxron baholash bajarildi", { attemptId });
    } catch (inner) {
      logger.error("[AttemptQueue] Fallback baholash xatosi", { message: inner.message });
      throw inner;
    }
  }
}

function startAttemptWorker() {
  if (process.env.DISABLE_ATTEMPT_WORKER === "true") {
    logger.warn("[AttemptQueue] Worker o'chirilgan (DISABLE_ATTEMPT_WORKER=true)");
    return null;
  }

  try {
    logger.info("[AttemptQueue] Worker ishga tushmoqda", { connection });
    const worker = new Worker(
      queueName,
      async (job) => {
        const { attemptId } = job.data;
        await evaluateAttemptByAI(attemptId);
        return { attemptId };
      },
      { connection }
    );

    worker.on("completed", (job) => {
      logger.info("[AttemptQueue] Baholash yakunlandi", { attemptId: job.data.attemptId });
    });

    worker.on("failed", (job, err) => {
      logger.error("[AttemptQueue] Baholash muvaffaqiyatsiz", { attemptId: job?.data?.attemptId, message: err?.message });
    });

    worker.on("error", (err) => {
      redisDisabled = true;
      logger.warn("[AttemptQueue] Worker xatosi, Redis ulanmayapti. Worker to'xtatildi.", { message: err?.message });
      try { worker.close(); } catch (e) { /* ignore */ }
    });

    logger.info("[AttemptQueue] Worker ishga tushdi");

    return worker;
  } catch (err) {
    redisDisabled = true;
    logger.warn("[AttemptQueue] Worker ishga tushmadi, Redis ulanmayapti", { message: err.message });
    return null;
  }
}

module.exports = { enqueueAttemptEvaluation, startAttemptWorker };