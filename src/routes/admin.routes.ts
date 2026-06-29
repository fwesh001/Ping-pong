import { Router } from "express";
import {
  deleteUser,
  getUser,
  listUsers,
  updateUser,
  updateUserStatus,
} from "../controllers/admin/users.controller";
import {
  deleteMonitor,
  getMonitor,
  listMonitors,
  toggleMonitorStatus,
  updateMonitor,
} from "../controllers/admin/monitors.controller";
import {
  createCreditPackage,
  deleteCreditPackage,
  listCreditPackages,
  listTransactions,
  updateCreditPackage,
} from "../controllers/admin/billing.controller";
import {
  deleteTicket,
  getTicket,
  listTickets,
  updateTicketStatus,
} from "../controllers/admin/support.controller";
import {
  getSettings,
  listAuditLogs,
  toggleLockdown,
  toggleMaintenanceMode,
  updateSettings,
} from "../controllers/admin/settings.controller";
import {
  handleWebhook,
  initializePayment,
} from "../controllers/admin/payment.controller";

const router = Router();

// Users
router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/status", updateUserStatus);

// Monitors
router.get("/monitors", listMonitors);
router.get("/monitors/:id", getMonitor);
router.put("/monitors/:id", updateMonitor);
router.delete("/monitors/:id", deleteMonitor);
router.put("/monitors/:id/toggle", toggleMonitorStatus);

// Billing
router.get("/packages", listCreditPackages);
router.post("/packages", createCreditPackage);
router.put("/packages/:id", updateCreditPackage);
router.delete("/packages/:id", deleteCreditPackage);
router.get("/transactions", listTransactions);

// Payments (Flutterwave)
router.post("/initialize-payment", initializePayment);
router.post("/webhook", handleWebhook);

// Support
router.get("/tickets", listTickets);
router.get("/tickets/:id", getTicket);
router.put("/tickets/:id", updateTicketStatus);
router.delete("/tickets/:id", deleteTicket);

// Settings / Audit
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.post("/settings/maintenance", toggleMaintenanceMode);
router.post("/settings/lockdown", toggleLockdown);
router.get("/logs", listAuditLogs);

export default router;
