// This file is auto-generated by @hey-api/openapi-ts

import { type Options as ClientOptions, type TDataShape, type Client, urlSearchParamsBodySerializer } from '@hey-api/client-fetch';
import type { ApiStatusData, LoginData, LoginResponse, LoginError, TestAccessTokenData, TestAccessTokenResponse, LogoutData, LogoutResponse } from './types.gen';
import { client as _heyApiClient } from './client.gen';

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = ClientOptions<TData, ThrowOnError> & {
    /**
     * You can provide a client instance returned by `createClient()` instead of
     * individual options. This might be also useful if you want to implement a
     * custom client.
     */
    client?: Client;
    /**
     * You can pass arbitrary values through the `meta` object. This can be
     * used to access values that aren't defined as part of the SDK function.
     */
    meta?: Record<string, unknown>;
};

/**
 * Estatus del API de usuarios
 * Reporta el estatus interno del API de usuarios
 */
export const apiStatus = <ThrowOnError extends boolean = false>(options?: Options<ApiStatusData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<unknown, unknown, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/api/usuarios/status',
        ...options
    });
};

/**
 * Obtains an access token
 * OAuth2 compatible token login, get an access token for future requests
 */
export const login = <ThrowOnError extends boolean = false>(options: Options<LoginData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<LoginResponse, LoginError, ThrowOnError>({
        ...urlSearchParamsBodySerializer,
        url: '/api/usuarios/login',
        ...options,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...options?.headers
        }
    });
};

/**
 * Test access token and return user info
 * Verifies the access token is correct and returns the related user info.
 */
export const testAccessToken = <ThrowOnError extends boolean = false>(options?: Options<TestAccessTokenData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).post<TestAccessTokenResponse, unknown, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/api/usuarios/test-token',
        ...options
    });
};

/**
 * Logouts the user
 * Logout user by blacklisting their token
 */
export const logout = <ThrowOnError extends boolean = false>(options?: Options<LogoutData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).post<LogoutResponse, unknown, ThrowOnError>({
        security: [
            {
                scheme: 'bearer',
                type: 'http'
            }
        ],
        url: '/api/usuarios/logout',
        ...options
    });
};