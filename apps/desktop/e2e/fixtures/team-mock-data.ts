import type { Page } from '@playwright/test';

export const mockUser = {
  id: 'usr-team-owner',
  email: 'alex@rozetka.ua',
  fullName: 'Alex Shevchenko',
  role: 'USER',
  organization: {
    id: 'org-rozetka-1',
    name: 'Rozetka Top Sellers LLC',
    role: 'OWNER',
  },
};

export interface MockInvitationState {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  token: string;
  inviteUrl: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface TeamTestState {
  organization: {
    id: string;
    name: string;
    ownerId: string;
    activePlan: string;
    maxTeamSeats: number;
    usedTeamSeats: number;
    currentUserRole: string;
    members: Array<{
      id: string;
      organizationId: string;
      userId: string;
      email: string;
      fullName: string;
      role: string;
      joinedAt: string;
    }>;
  };
  invitations: MockInvitationState[];
  license: {
    id: string;
    userId: string;
    organizationId: string;
    organizationName: string;
    licenseKey: string;
    planType: string;
    canCloudBackup: boolean;
    maxXmlLimit: number;
    maxTeamSeats: number;
    aiCredits: number;
    isActive: boolean;
    expiresAt: string;
    isExpired: boolean;
    daysRemaining: number;
  };
}

export function createInitialTeamState(): TeamTestState {
  return {
    organization: {
      id: 'org-rozetka-1',
      name: 'Rozetka Top Sellers LLC',
      ownerId: mockUser.id,
      activePlan: 'STARTER',
      maxTeamSeats: 1,
      usedTeamSeats: 1,
      currentUserRole: 'OWNER',
      members: [
        {
          id: 'mem-1',
          organizationId: 'org-rozetka-1',
          userId: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          role: 'OWNER',
          joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    invitations: [],
    license: {
      id: 'lic-org-1',
      userId: mockUser.id,
      organizationId: 'org-rozetka-1',
      organizationName: 'Rozetka Top Sellers LLC',
      licenseKey: 'SF-STARTER-ABCD-EFGH-1234',
      planType: 'STARTER',
      canCloudBackup: false,
      maxXmlLimit: 500,
      maxTeamSeats: 1,
      aiCredits: 0,
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isExpired: false,
      daysRemaining: 7,
    },
  };
}

export async function setupTeamRoutes(page: Page, state: TeamTestState) {
  await page.addInitScript((user) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('smartfeed_access_token', 'mock-valid-token');
    window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
    window.localStorage.setItem('smartfeed_language', 'uk');
  }, mockUser);

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    });
  });

  await page.route('**/api/licenses/my', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.license),
    });
  });

  await page.route(/\/api\/organizations$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([state.organization]),
    });
  });

  await page.route(/\/api\/organizations\/org-rozetka-1$/, async (route) => {
    if (route.request().method() === 'PATCH') {
      const payload = JSON.parse(route.request().postData() || '{}');
      state.organization.name = payload.name;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.organization),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.organization),
      });
    }
  });

  await page.route(/\/api\/organizations\/org-rozetka-1\/invitations$/, async (route) => {
    if (route.request().method() === 'POST') {
      const payload = JSON.parse(route.request().postData() || '{}');
      const token = `SF-INV-mock-${Date.now()}`;
      const newInv: MockInvitationState = {
        id: `inv-${Date.now()}`,
        organizationId: 'org-rozetka-1',
        email: payload.email,
        role: payload.role || 'MEMBER',
        token,
        inviteUrl: `http://localhost:1420/invite?token=${token}`,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      state.invitations.push(newInv);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newInv),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.invitations),
      });
    }
  });

  await page.route(/\/api\/organizations\/org-rozetka-1\/invitations\/[^/]+$/, async (route) => {
    if (route.request().method() === 'DELETE') {
      const urlParts = route.request().url().split('/');
      const invId = urlParts[urlParts.length - 1];
      state.invitations = state.invitations.filter((i) => i.id !== invId);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });

  await page.route(/\/api\/organizations\/org-rozetka-1\/members$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.organization.members),
    });
  });

  await page.route(/\/api\/organizations\/org-rozetka-1\/members\/[^/]+$/, async (route) => {
    if (route.request().method() === 'DELETE') {
      const urlParts = route.request().url().split('/');
      const memberId = urlParts[urlParts.length - 1];
      state.organization.members = state.organization.members.filter((m) => m.id !== memberId);
      state.organization.usedTeamSeats = state.organization.members.length;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });

  await page.route(/\/api\/invitations\/[^/]+$/, async (route) => {
    const url = route.request().url();
    if (url.includes('/accept')) {
      const payload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'usr-invited-1',
            email: 'maria@rozetka.ua',
            fullName: payload.fullName || 'Maria',
            role: 'USER',
            organization: {
              id: 'org-rozetka-1',
              name: 'Rozetka Top Sellers LLC',
              role: 'MEMBER',
            },
          },
          tokens: {
            accessToken: 'mock-invited-token',
            refreshToken: 'mock-invited-refresh',
            tokenType: 'Bearer',
            expiresIn: 900,
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'SF-INV-valid-token-123',
          email: 'maria@rozetka.ua',
          role: 'MEMBER',
          organizationName: 'Rozetka Top Sellers LLC',
          inviterName: 'Alex Shevchenko',
          isExistingUser: false,
          isValid: true,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    }
  });
}
