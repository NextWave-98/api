import { Router } from 'express';
import { InstallmentController } from './installment.controller';

const router = Router();
const installmentController = new InstallmentController();

// Customer Financial Details Routes
router.post(
    '/financial-details',
    installmentController.addFinancialDetails.bind(installmentController)
);

router.put(
    '/financial-details/:customerId',
    installmentController.updateFinancialDetails.bind(installmentController)
);

router.get(
    '/financial-details/:customerId',
    installmentController.getFinancialDetails.bind(installmentController)
);

// Installment Plan Routes
router.post(
    '/plans',
    installmentController.createInstallmentPlan.bind(installmentController)
);

router.get(
    '/plans/:id',
    installmentController.getInstallmentPlanById.bind(installmentController)
);

router.get(
    '/plans',
    installmentController.getInstallmentPlans.bind(installmentController)
);

router.get(
    '/customer/:customerId',
    installmentController.getCustomerInstallments.bind(installmentController)
);

// Payment Routes
router.post(
    '/payments',
    installmentController.recordPayment.bind(installmentController)
);

router.get(
    '/overdue',
    installmentController.getOverduePayments.bind(installmentController)
);

// Statistics
router.get(
    '/stats',
    installmentController.getInstallmentStats.bind(installmentController)
);

// Admin/System Routes
router.post(
    '/check-late-payments',
    installmentController.checkLatePayments.bind(installmentController)
);

router.post(
    '/process-notifications',
    installmentController.processNotifications.bind(installmentController)
);

export default router;
