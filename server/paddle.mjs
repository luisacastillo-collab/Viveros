import { Environment, LogLevel, Paddle } from "@paddle/paddle-node-sdk";

let paddleInstance;

export function getPaddleEnvironment() {
  const environment = process.env.PADDLE_ENV;

  if (!environment) {
    throw new Error("PADDLE_ENV is not set. Use sandbox or production.");
  }

  if (environment !== "sandbox" && environment !== "production") {
    throw new Error("PADDLE_ENV must be sandbox or production.");
  }

  return environment === "sandbox" ? Environment.sandbox : Environment.production;
}

export function getPaddle() {
  if (!process.env.PADDLE_API_KEY) {
    throw new Error("PADDLE_API_KEY is not set.");
  }

  if (!paddleInstance) {
    paddleInstance = new Paddle(process.env.PADDLE_API_KEY, {
      environment: getPaddleEnvironment(),
      logLevel: LogLevel.error,
    });
  }

  return paddleInstance;
}
