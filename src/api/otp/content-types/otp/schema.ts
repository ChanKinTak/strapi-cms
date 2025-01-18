// src/api/otp/content-types/otp/schema.ts
export default {
    kind: 'collectionType',
    collectionName: 'otps',
    info: {
      singularName: 'otp',
      pluralName: 'otps',
      displayName: 'OTP',
    },
    options: {
      draftAndPublish: false,
    },
    attributes: {
      email: {
        type: 'email',
        required: true,
      },
      code: {
        type: 'string',
        required: true,
      },
      expiresAt: {
        type: 'datetime',
        required: true,
      },
      used: {
        type: 'boolean',
        default: false,
        required: true,
      },
    },
  } as const;