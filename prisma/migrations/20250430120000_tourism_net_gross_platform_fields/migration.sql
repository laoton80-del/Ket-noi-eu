-- Optimal Financial Guardrails: persist gross vs net platform economics on tourism bookings.
ALTER TABLE "TourismBooking" ADD COLUMN "grossPlatformFeePoolVIG" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "TourismBooking" ADD COLUMN "kngNetPlatformRevenueVIG" DOUBLE PRECISION NOT NULL DEFAULT 0;
