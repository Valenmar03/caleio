import app from "./app";
import cron from "node-cron";
import { runReminderJob } from "./jobs/reminder.job";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`✅ Lumina API running on http://localhost:${PORT}`);
});

// Recordatorios: cada 15 minutos
cron.schedule("*/15 * * * *", () => {
  runReminderJob();
});
