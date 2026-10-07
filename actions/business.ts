"use server";

export type BusinessActionResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

export function createBusinessActionResult<T>(result: BusinessActionResult<T>): BusinessActionResult<T> {
  return result;
}
