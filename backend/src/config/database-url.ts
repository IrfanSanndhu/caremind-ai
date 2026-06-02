export function buildPostgresUrl(params: {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}): string {
  const encodedPassword = encodeURIComponent(params.password);
  return `postgresql://${params.user}:${encodedPassword}@${params.host}:${params.port}/${params.database}`;
}
