import { HttpException, Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import * as Sentry from '@sentry/node';
import Config from '../../../config';
import type { Auth0Response, EmailVerificationTicket } from './auth0.types';

@Injectable()
export class Auth0Service {
  // Get an access token for the Auth0 Admin API
  async getAdminAccessToken(): Promise<{ access_token: string }> {
    const options = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: Config.auth0.backend.CLIENT_ID,
        client_secret: Config.auth0.backend.CLIENT_SECRET,
        audience: `https://${Config.auth0.backend.DOMAIN}/api/v2/`,
        grant_type: 'client_credentials',
      }),
    };

    const response = await fetch(
      `https://${Config.auth0.backend.DOMAIN}/oauth/token`,
      options,
    );
    const json = await response.json();

    return json;
  }

  // Get the user's profile from auth0
  async getUserProfile(accessToken: string, userID: string) {
    const options = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const response = await fetch(
      `https://${Config.auth0.backend.DOMAIN}/api/v2/users/${userID}`,
      options,
    );
    const json = await response.json();

    return json;
  }

  // Deletes a user from auth0
  async deleteUser(accessToken: string, userID: string) {
    const options = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const response = await fetch(
      `https://${Config.auth0.backend.DOMAIN}/api/v2/users/${userID}`,
      options,
    );

    return response;
  }

  async createVerificationEmailTicket(
    accessToken: string,
    auth0UserId: string,
  ) {
    try {
      const [provider, userId] = auth0UserId.split('|');
      const payload = {
        result_url: Config.urls.CLIENT_BASE_URL,
        user_id: auth0UserId,
        identity: { user_id: userId, provider },
      };

      const options = {
        method: 'POST',
        headers: {
          /* tslint:disable-next-line */
          Authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      const response: Auth0Response<EmailVerificationTicket> = await (
        await fetch(
          `https://${Config.auth0.backend.DOMAIN}/api/v2/tickets/email-verification`,
          options,
        )
      ).json();

      if ('statusCode' in response) {
        throw new HttpException(response, response.statusCode);
      }

      return response;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
}
