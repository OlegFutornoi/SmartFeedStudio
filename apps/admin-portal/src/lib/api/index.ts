import { baseClient } from '@/lib/api/client';
import * as auth from '@/lib/api/auth';
import * as users from '@/lib/api/users';
import * as navigation from '@/lib/api/navigation';
import * as plans from '@/lib/api/plans';
import * as licenses from '@/lib/api/licenses';
import * as payments from '@/lib/api/payments';

export * from '@/lib/api/client';
export * from '@/lib/api/auth';
export * from '@/lib/api/users';
export * from '@/lib/api/navigation';
export * from '@/lib/api/plans';
export * from '@/lib/api/licenses';
export * from '@/lib/api/payments';

export const api = {
  // Client token controls
  setToken: baseClient.setToken.bind(baseClient),
  getToken: baseClient.getToken.bind(baseClient),
  getRefreshToken: baseClient.getRefreshToken.bind(baseClient),

  // Auth
  login: auth.login,
  getMe: auth.getMe,
  changePassword: auth.changePassword,
  updateAvatar: auth.updateAvatar,

  // Users
  getUsers: users.getUsers,
  getUsersStats: users.getUsersStats,
  createUser: users.createUser,
  updateUserStatus: users.updateUserStatus,
  deleteUser: users.deleteUser,

  // Navigation
  getNavigation: navigation.getNavigation,
  getAdminNavigationItems: navigation.getAdminNavigationItems,
  createNavigationItem: navigation.createNavigationItem,
  updateNavigationItem: navigation.updateNavigationItem,
  deleteNavigationItem: navigation.deleteNavigationItem,
  reorderNavigationItems: navigation.reorderNavigationItems,

  // Plans
  getTariffPlans: plans.getTariffPlans,
  getAdminTariffPlans: plans.getAdminTariffPlans,
  createTariffPlan: plans.createTariffPlan,
  updateTariffPlan: plans.updateTariffPlan,
  deleteTariffPlan: plans.deleteTariffPlan,

  // Licenses
  getAdminLicenses: licenses.getAdminLicenses,
  updateLicenseStatus: licenses.updateLicenseStatus,
  deleteLicense: licenses.deleteLicense,

  // Payments
  getPaymentTransactions: payments.getPaymentTransactions,
  getPaymentStats: payments.getPaymentStats,
  getPaymentSettings: payments.getPaymentSettings,
  updatePaymentSetting: payments.updatePaymentSetting,
};
