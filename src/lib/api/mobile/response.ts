import { NextResponse } from 'next/server';

export type MobileErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'conflict'
  | 'internal_error';

export type MobileSuccessEnvelope<T> = {
  success: true;
  data: T;
};

export type MobileErrorEnvelope = {
  success: false;
  error: {
    code: MobileErrorCode;
    message: string;
    details?: unknown;
  };
};

export function mobileSuccess<T>(data: T, status = 200) {
  return NextResponse.json<MobileSuccessEnvelope<T>>(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function mobileError(
  code: MobileErrorCode,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json<MobileErrorEnvelope>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}
