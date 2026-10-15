import { z } from 'zod';
import { Role, PlanType, TargetApp } from '../enums';

export const NavigationItemSchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(1),
  labelUk: z.string().min(1),
  labelEn: z.string().min(1),
  path: z.string().min(1),
  icon: z.string().min(1).default('LayoutDashboard'),
  order: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  requiredRoles: z.array(z.nativeEnum(Role)).default([Role.USER, Role.ADMIN, Role.SUPER_ADMIN]),
  requiredPlan: z.nativeEnum(PlanType).nullable().optional(),
  targetApp: z.nativeEnum(TargetApp).default(TargetApp.DESKTOP),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type NavigationItemDto = z.infer<typeof NavigationItemSchema>;

export const CreateNavigationItemSchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .regex(/^[a-z0-9_-]+$/, 'Key must be alphanumeric, hyphen or underscore'),
  labelUk: z.string().min(1, 'Ukrainian label is required'),
  labelEn: z.string().min(1, 'English label is required'),
  path: z.string().min(1, 'Path is required'),
  icon: z.string().min(1).default('LayoutDashboard'),
  order: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  requiredRoles: z.array(z.nativeEnum(Role)).default([Role.USER, Role.ADMIN, Role.SUPER_ADMIN]),
  requiredPlan: z.nativeEnum(PlanType).nullable().optional(),
  targetApp: z.nativeEnum(TargetApp).default(TargetApp.DESKTOP),
});

export type CreateNavigationItemDto = z.infer<typeof CreateNavigationItemSchema>;

export const UpdateNavigationItemSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  labelUk: z.string().min(1).optional(),
  labelEn: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
  order: z.number().int().optional(),
  isVisible: z.boolean().optional(),
  requiredRoles: z.array(z.nativeEnum(Role)).optional(),
  requiredPlan: z.nativeEnum(PlanType).nullable().optional(),
  targetApp: z.nativeEnum(TargetApp).optional(),
});

export type UpdateNavigationItemDto = z.infer<typeof UpdateNavigationItemSchema>;

export const ReorderNavigationItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int(),
    }),
  ),
});

export type ReorderNavigationItemsDto = z.infer<typeof ReorderNavigationItemsSchema>;
