const TARGET_TEMPERATURE = 0;

const TURN_ON_TEMPERATURE = -19;
const TURN_OFF_TEMPERATURE = -20.5;

const MINIMUM_RUNNING_OUTPUT = 40;
const MAXIMUM_OUTPUT = 100;

// The pump reaches 100% when this far above target.
const FULL_POWER_ERROR = 8;

// Maximum percentage change during one control cycle.
const MAX_OUTPUT_CHANGE = 5;

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.max(
    minimum,
    Math.min(maximum, value)
  );
}

export function calculatePumpOutput(
  temperature: number,
  previousOutput: number
): number {
  if (!Number.isFinite(temperature)) {
    return 0;
  }

  if (
    previousOutput === 0 &&
    temperature < TURN_ON_TEMPERATURE
  ) {
    return 0;
  }

  if (
    previousOutput > 0 &&
    temperature <= TURN_OFF_TEMPERATURE
  ) {
    return 0;
  }

  // Begin at the minimum reliable output.
  if (previousOutput === 0) {
    return MINIMUM_RUNNING_OUTPUT;
  }

  const temperatureError =
    temperature - TARGET_TEMPERATURE;

  const normalizedError = clamp(
    temperatureError / FULL_POWER_ERROR,
    0,
    1
  );

  const desiredOutput =
    MINIMUM_RUNNING_OUTPUT +
    normalizedError *
      (MAXIMUM_OUTPUT - MINIMUM_RUNNING_OUTPUT);

  const limitedOutput = clamp(
    desiredOutput,
    previousOutput - MAX_OUTPUT_CHANGE,
    previousOutput + MAX_OUTPUT_CHANGE
  );

  const roundedOutput =
    Math.round(limitedOutput / 5) * 5;

  return clamp(
    roundedOutput,
    MINIMUM_RUNNING_OUTPUT,
    MAXIMUM_OUTPUT
  );
}