'use client';

import { Card, CardContent, Typography, Skeleton } from '@mui/material';

export default function KpiCard({
  title,
  value,
  helper,
  suffix,
  loading = false,
}: {
  title: string;
  value: string | number;
  helper?: string;
  suffix?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        {loading ? (
          <Skeleton variant="text" sx={{ fontSize: 36, width: '60%', mt: 1 }} />
        ) : (
          <Typography variant="h4" className="font-semibold mt-1">
            {value}{suffix ? <span className="text-base text-gray-500 ml-1">{suffix}</span> : null}
          </Typography>
        )}
        {helper ? (
          <Typography variant="caption" color="text.secondary" className="block mt-1">
            {helper}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}