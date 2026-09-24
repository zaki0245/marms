// src/shared/asyncHandler.ts
// [FUNGSI] Pembungkus untuk controller async agar error otomatis diteruskan.
// [ALASAN] Express 4 tidak menangkap error dari fungsi async; tanpa ini error
//          bisa menggantung. Pembungkus ini dipakai semua controller.

import type { NextFunction, Request, RequestHandler, Response } from 'express';

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
