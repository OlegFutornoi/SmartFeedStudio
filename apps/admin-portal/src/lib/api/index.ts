import { baseClient } from './client';
import * as auth from './auth';
import * as users from './users';
import * as navigation from './navigation';
import * as plans from './plans';
import * as licenses from './licenses';
import * as payments from './payments';

export * from './client';
export * from './auth';
export * from './users';
export * from './navigation';
export * from './plans';
export * from './licenses';
export * from './payments';

export const api = {
  // Client token controls
  setToken: baseClient.setToken.bind(baseClient),
  getToken: baseClient.getToken.bind(baseClient),
  getRefreshToken: baseClient.getRefreshToken.bind(baseClient),

  // Auth
  login: auth.login,
  getMe: auth.getMe,
  changePassword: auth.changePassword,

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
