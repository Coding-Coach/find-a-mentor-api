// Ref: https://carterbancroft.com/mocking-json-web-tokens-and-auth0

import * as jwt from 'jsonwebtoken';
import * as nock from 'nock';
import * as faker from 'faker';
import { AccessTokenUser } from '../../src/types/request';

const testPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA3hcdO8Q55PC7zy9MLfpR2HrPmFf6GFMO/rQXUwtAI4JveIcT
SuJ4h3AaXWzmmEjz/0WG/+kYwqiMH/aVAW6dG2iQ/Wz902RHNyH44RTek+flDvs3
lwiW/zvUutDfLRoXguSaIdYaJTDurqnMjNyMOXGn9FDA14ArC98nFVTXB8YN04N+
1PDNsILyEXxFtG9QIHcZelMgKErPSW7qnofc0VE+1/eJ7ohJQam0+53nCM1mt3Vw
LWXW+h4mM+s8qeITu6YP6jrhkXIm/nlkyfIUOOOWX4PFiaRvTGoLUYp0K0PinCd1
Txp+jERGvkPXv7fHJ7mN8qGAOh9QocxKEz+H6QIDAQABAoIBABitntejpVSVlM5K
kNTRv5h7hRKGQXRvKPe6e+uuu1t2xKYy9DzaT3mqm54NWiOf2k+098b7WCoBNUOJ
UI4OhDH7Jj6oMXL07fOSuHy3p0fuI7DMz3oz6ntwDY0OD/k2BgN1yClsXg6155Uh
qb4ZSmeeWS23xMXtfbBdr+fEkU7786CjpTv2YeLUAl25GywxoKhp3ludxYmuuRq4
6JgE8mY30ksSr9v2yTY+En8bJcHvT9pLTdcGnc4XeKUg1+Va6WURwQByyM0oxh2F
Zi5Ok/z4JoYiq015N3E+tErLnMn1tuwNir/BJMTP+L2fIoxwUmd0yaT/VvD4bfEa
rcbJkoUCgYEA5pnLVlyeIaQFeaR9n6MwnK+98dqg0uFRDSR/OzssVjMIiw5s62HB
5OxhYn2NCz7/mieyW4kmwxHMwoeo2/quTl8YIIk0WKg2kjJ1fgAk++pjVAnHz26d
xj9nppL6czPjoT271LEFZDT39wbAzbBjLL12S9iJ1KfbJ4IHrZFBlUcCgYEA9o1a
EXJNPYTBEFtvvcwU2ZebqEHR+EWMcDKHTZTqsQ34iMBU+jUgS/6Adb7FzHtctK7G
EGBcS9vaJV8UfVzbHFgGr2F0c4QoYLNgwKgw67NyCixCCIthywcxL/8Ymgo8WyIC
oXNl5w2yFcBN/JBuP1QJ91B8wCYS7+AVRQGBUU8CgYEAnKR/8Yw8hpGKfpT0GMqb
rPPcTTu730Pa8NiH7M5HUc6c0QjdiA8BzOWdSXALrUYADtFEYNWLlRq0QrgwRi3E
1cvW8dMB0e+CElFgalTiypTvIBj8t7VmS1KqsAZLRpJK4C61NseA6A7rGcxmj9Jv
q+aPQvo2tlPHlNDJMmfnauUCgYEAhkczz56t/JxJvcvezsLQdDWC3B+E6K+QLicG
07UQIP/X5TrCzUaT4W+prPcKqTRiqDErxA2HFvWVGJdxBFnHJ+e1NF1iW+uVRh1L
y4GOq0AfEvVJvXeT+kxfeKF5V6PNfWDHiADedflajUgf8TcEJE9z4hMe7lOOKsCj
NOL9+DcCgYAevvM8wrHa2r0EaWV5sWgPWX7zV1pSjKhBlTDtBo1Qek886YxToQoF
28rg1dZ+SKxefHeKbKSQ1wit1XTDROtd5fT3CPYrD5u1kDwhJORRV8uJZFs2EFpk
Nfhiber3jo0aXin1W0aGvEfb7L6RpSfWu7OkxvFchREbukVsH0+bQg==
-----END RSA PRIVATE KEY-----`;

const jwks = {
  keys: [
    {
      alg: 'RS256',
      kty: 'RSA',
      use: 'sig',
      /* tslint:disable-next-line */
      n: '3hcdO8Q55PC7zy9MLfpR2HrPmFf6GFMO_rQXUwtAI4JveIcTSuJ4h3AaXWzmmEjz_0WG_-kYwqiMH_aVAW6dG2iQ_Wz902RHNyH44RTek-flDvs3lwiW_zvUutDfLRoXguSaIdYaJTDurqnMjNyMOXGn9FDA14ArC98nFVTXB8YN04N-1PDNsILyEXxFtG9QIHcZelMgKErPSW7qnofc0VE-1_eJ7ohJQam0-53nCM1mt3VwLWXW-h4mM-s8qeITu6YP6jrhkXIm_nlkyfIUOOOWX4PFiaRvTGoLUYp0K0PinCd1Txp-jERGvkPXv7fHJ7mN8qGAOh9QocxKEz-H6Q',
      e: 'AQAB',
      kid: '0',
    },
  ],
};

nock(`https://${process.env.AUTH0_DOMAIN}`)
  .persist()
  .get('/.well-known/jwks.json')
  .reply(200, jwks);

export const getToken = (
  user = { auth0Id: faker.random.uuid() },
  emailVerified = true,
) => {
  const payload: Partial<AccessTokenUser> = {
    sub: user.auth0Id,
    email_verified: emailVerified,
  };

  const options = {
    header: { kid: '0' },
    algorithm: 'RS256',
    expiresIn: '1d',
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  };

  return jwt.sign(payload, testPrivateKey, options);
};
