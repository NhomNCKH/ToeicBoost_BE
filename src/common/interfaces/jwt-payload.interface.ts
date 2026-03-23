export interface IJwtPayload {
  sub: string;
  email: string;
  role: string;
  roles: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
