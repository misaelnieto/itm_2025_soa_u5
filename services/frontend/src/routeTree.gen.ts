/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as LoginImport } from './routes/login'
import { Route as LayoutImport } from './routes/_layout'
import { Route as JuegosIndexImport } from './routes/juegos/index'
import { Route as LayoutIndexImport } from './routes/_layout/index'
import { Route as LayoutSettingsImport } from './routes/_layout/settings'
import { Route as LayoutLeaderboardImport } from './routes/_layout/leaderboard'
import { Route as LayoutAdminImport } from './routes/_layout/admin'
import { Route as JuegosAjedrezIndexImport } from './routes/juegos/ajedrez/index'
import { Route as JuegosAjedrezLeaderboardImport } from './routes/juegos/ajedrez/leaderboard'

// Create/Update Routes

const LoginRoute = LoginImport.update({
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const LayoutRoute = LayoutImport.update({
  id: '/_layout',
  getParentRoute: () => rootRoute,
} as any)

const JuegosIndexRoute = JuegosIndexImport.update({
  path: '/juegos/',
  getParentRoute: () => rootRoute,
} as any)

const LayoutIndexRoute = LayoutIndexImport.update({
  path: '/',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutSettingsRoute = LayoutSettingsImport.update({
  path: '/settings',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutLeaderboardRoute = LayoutLeaderboardImport.update({
  path: '/leaderboard',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutAdminRoute = LayoutAdminImport.update({
  path: '/admin',
  getParentRoute: () => LayoutRoute,
} as any)

const JuegosAjedrezIndexRoute = JuegosAjedrezIndexImport.update({
  path: '/juegos/ajedrez/',
  getParentRoute: () => rootRoute,
} as any)

const JuegosAjedrezLeaderboardRoute = JuegosAjedrezLeaderboardImport.update({
  path: '/juegos/ajedrez/leaderboard',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_layout': {
      preLoaderRoute: typeof LayoutImport
      parentRoute: typeof rootRoute
    }
    '/login': {
      preLoaderRoute: typeof LoginImport
      parentRoute: typeof rootRoute
    }
    '/_layout/admin': {
      preLoaderRoute: typeof LayoutAdminImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/leaderboard': {
      preLoaderRoute: typeof LayoutLeaderboardImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/settings': {
      preLoaderRoute: typeof LayoutSettingsImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/': {
      preLoaderRoute: typeof LayoutIndexImport
      parentRoute: typeof LayoutImport
    }
    '/juegos/': {
      preLoaderRoute: typeof JuegosIndexImport
      parentRoute: typeof rootRoute
    }
    '/juegos/ajedrez/leaderboard': {
      preLoaderRoute: typeof JuegosAjedrezLeaderboardImport
      parentRoute: typeof rootRoute
    }
    '/juegos/ajedrez/': {
      preLoaderRoute: typeof JuegosAjedrezIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  LayoutRoute.addChildren([
    LayoutAdminRoute,
    LayoutLeaderboardRoute,
    LayoutSettingsRoute,
    LayoutIndexRoute,
  ]),
  LoginRoute,
  JuegosIndexRoute,
  JuegosAjedrezLeaderboardRoute,
  JuegosAjedrezIndexRoute,
])

/* prettier-ignore-end */
