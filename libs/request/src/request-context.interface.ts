/**
 * Request context passed through the dismissible operations.
 */
export type IRequestContext = {
  requestId: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  params: Record<string, string>;
  body: Record<string, string>;
  user: Record<string, string>;
  ip: string;
  method: string;
  url: string;
  protocol: string;
  secure: boolean;
  hostname: string;
  port: number;
  path: string;
  search: string;
  searchParams: Record<string, string>;
  origin: string;
  referer: string;
  userAgent: string;
};
