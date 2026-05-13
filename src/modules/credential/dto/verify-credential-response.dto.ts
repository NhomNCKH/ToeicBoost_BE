export interface VerifyCredentialResponse {
  authentic: boolean;
  message: string;
  reason?: string;
  credential?: {
    id: string;
    serialNumber: string;
    status: string;
    issuedAt: string;
    expiresAt: string | null;
    revokedAt: string | null;
    revocationReason: string | null;
    issuer: {
      name: string;
      did: string | null;
    };
    subject: {
      userId: string;
      did: string | null;
      name: string;
      email: string;
    };
    score: {
      total: number;
      passThreshold: number;
      listening: number | null;
      reading: number | null;
      passed: boolean;
    };
    exam: {
      attemptId: string;
      templateId: string | null;
      templateName: string | null;
      templateCode: string | null;
    };
    integrity: {
      mode: string;
      hashAlgorithm: string;
      payloadHash: string;
      chainHash: string;
      previousChainHash: string | null;
      onChainPayloadMatchesDb: boolean | null;
    };
    storage: {
      ipfsCid: string | null;
      ipfsGatewayUrl: string | null;
      storageUri: string | null;
    };
    qr: {
      token: string;
      url: string | null;
      imageUrl: string | null;
    };
  };
}
